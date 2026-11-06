import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User, RoleEnum
from app.models.category import Category
from app.models.issue_group import IssueGroup, IssueStatus, IssuePriority
from app.models.report import Report, ReportStatus
from app.models.ai_suggestion import AISuggestion
from app.models.status_history import StatusHistory
from app.schemas.report import ReportCreate, ReportResponse
from app.utils.code_generator import generate_complaint_id, generate_reference_code
from app.services.ai_service import AIService
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, require_citizen, require_admin

router = APIRouter(prefix="/reports", tags=["Reports"])

UPLOAD_REPORTS_DIR = os.path.join("uploads", "reports")
os.makedirs(UPLOAD_REPORTS_DIR, exist_ok=True)

@router.post("/upload-image")
async def upload_report_image(file: UploadFile = File(...)):
    # Validate extension
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Please upload {', '.join(allowed)}."
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_REPORTS_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    return {"image_url": f"/uploads/reports/{filename}"}

@router.post("/submit", response_model=ReportResponse)
def submit_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    category = db.query(Category).filter(Category.id == report_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified category does not exist."
        )

    # 1. Run AI analysis: Category classification check & priority recommendation
    cat_name = category.name
    priority_res = AIService.recommend_priority(
        description=report_in.description,
        category=cat_name
    )

    # 2. Run AI duplicate detection against active IssueGroups
    active_issue_groups = db.query(IssueGroup).filter(
        IssueGroup.status.notin_([IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value])
    ).all()

    dup_res = AIService.find_potential_duplicates(
        new_title=report_in.title,
        new_description=report_in.description,
        new_lat=report_in.latitude,
        new_lon=report_in.longitude,
        existing_issue_groups=active_issue_groups
    )

    complaint_id = generate_complaint_id()

    # Create the central IssueGroup for this new report
    ref_code = generate_reference_code()
    new_issue_group = IssueGroup(
        reference_code=ref_code,
        title=report_in.title,
        description=report_in.description,
        category_id=category.id,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        location_address=report_in.location_address,
        status=IssueStatus.REPORTED.value,
        priority=priority_res["suggested_priority"],
        priority_verified_by_admin=False
    )
    db.add(new_issue_group)
    db.flush()

    # Record initial status history
    initial_history = StatusHistory(
        issue_group_id=new_issue_group.id,
        changed_by_user_id=current_user.id,
        from_status="NONE",
        to_status=IssueStatus.REPORTED.value,
        remarks=f"Citizen {current_user.full_name} submitted report #{complaint_id}."
    )
    db.add(initial_history)

    # Create Report record linked to this IssueGroup
    new_report = Report(
        complaint_id=complaint_id,
        citizen_id=current_user.id,
        issue_group_id=new_issue_group.id,
        category_id=category.id,
        title=report_in.title,
        description=report_in.description,
        image_url=report_in.image_url,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        location_address=report_in.location_address,
        status=ReportStatus.SUBMITTED.value
    )
    db.add(new_report)
    db.flush()

    # Create AISuggestion record
    top_dup = dup_res["duplicates"][0] if dup_res["duplicates"] else None
    ai_sugg = AISuggestion(
        report_id=new_report.id,
        suggested_category_id=category.id,
        category_confidence=0.92,
        suggested_priority=priority_res["suggested_priority"],
        priority_reasoning=priority_res["reasoning"],
        duplicate_detected=dup_res["has_potential_duplicates"],
        matched_issue_group_id=top_dup["issue_group_id"] if top_dup else None,
        similarity_score=top_dup["similarity_score"] if top_dup else None,
        distance_meters=top_dup["distance_meters"] if top_dup else None,
        model_name=dup_res["model_name"]
    )
    db.add(ai_sugg)

    # Citizen confirmation notification
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        title="Complaint Submitted Successfully",
        message=f"Your complaint #{complaint_id} for '{report_in.title}' has been registered and is pending verification.",
        notification_type="REPORT_SUBMITTED",
        issue_group_id=new_issue_group.id,
        report_id=new_report.id
    )

    db.commit()
    db.refresh(new_report)

    return new_report

@router.get("/my-reports", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    reports = db.query(Report).options(
        joinedload(Report.category),
        joinedload(Report.ai_suggestion)
    ).filter(
        Report.citizen_id == current_user.id
    ).order_by(Report.created_at.desc()).all()
    return reports

@router.get("/by-id/{report_id}", response_model=ReportResponse)
def get_report_by_id(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).options(
        joinedload(Report.category),
        joinedload(Report.ai_suggestion)
    ).filter(
        (Report.id == report_id) | (Report.complaint_id == report_id)
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Complaint report not found.")

    # Restrict citizen to their own report unless admin/worker
    if current_user.role == RoleEnum.CITIZEN.value and report.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this report.")

    return report

@router.get("", response_model=List[ReportResponse])
def list_all_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Report).options(
        joinedload(Report.category),
        joinedload(Report.ai_suggestion)
    )

    if status_filter:
        query = query.filter(Report.status == status_filter)
    if category_id:
        query = query.filter(Report.category_id == category_id)
    if search:
        query = query.filter(
            (Report.title.ilike(f"%{search}%")) |
            (Report.complaint_id.ilike(f"%{search}%")) |
            (Report.description.ilike(f"%{search}%"))
        )

    return query.order_by(Report.created_at.desc()).all()

