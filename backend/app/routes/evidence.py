import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User, RoleEnum
from app.models.issue_group import IssueGroup, IssueStatus
from app.models.report import Report, ReportStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.evidence import Evidence, EvidenceType
from app.models.status_history import StatusHistory
from app.schemas.evidence import (
    EvidenceCreate, EvidenceVerifyRequest, EvidenceResponse
)
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, require_worker, require_admin

router = APIRouter(prefix="/evidence", tags=["Evidence Verification"])

UPLOAD_EVIDENCE_DIR = os.path.join("uploads", "evidence")
os.makedirs(UPLOAD_EVIDENCE_DIR, exist_ok=True)

@router.post("/upload-file")
async def upload_evidence_file(file: UploadFile = File(...)):
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format. Allowed: {', '.join(allowed)}"
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_EVIDENCE_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    return {"image_url": f"/uploads/evidence/{filename}"}

@router.post("/upload", response_model=EvidenceResponse)
def submit_evidence(
    evidence_in: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    issue = db.query(IssueGroup).filter(IssueGroup.id == evidence_in.issue_group_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    evidence = Evidence(
        issue_group_id=issue.id,
        uploaded_by_id=current_user.id,
        evidence_type=evidence_in.evidence_type,
        image_url=evidence_in.image_url,
        remarks=evidence_in.remarks,
        is_verified_by_admin=False
    )
    db.add(evidence)

    # If AFTER_REPAIR, transition issue to PENDING_VERIFICATION
    if evidence_in.evidence_type == EvidenceType.AFTER_REPAIR.value:
        old_status = issue.status
        issue.status = IssueStatus.PENDING_VERIFICATION.value

        history = StatusHistory(
            issue_group_id=issue.id,
            changed_by_user_id=current_user.id,
            from_status=old_status,
            to_status=IssueStatus.PENDING_VERIFICATION.value,
            remarks=f"Worker {current_user.full_name} submitted repair evidence photographic proof. Pending Administrator Verification."
        )
        db.add(history)

        # Also update active worker assignment to SUBMITTED
        assignment = db.query(Assignment).filter(
            Assignment.issue_group_id == issue.id,
            Assignment.worker_id == current_user.id
        ).first()
        if assignment:
            assignment.status = AssignmentStatus.SUBMITTED.value

    db.commit()
    db.refresh(evidence)
    return evidence

@router.get("/{issue_group_id}", response_model=List[EvidenceResponse])
def get_issue_evidence(
    issue_group_id: str,
    db: Session = Depends(get_db)
):
    evidence_list = db.query(Evidence).options(
        joinedload(Evidence.uploaded_by)
    ).filter(
        Evidence.issue_group_id == issue_group_id
    ).order_by(Evidence.created_at.desc()).all()
    return evidence_list

@router.post("/{evidence_id}/verify", response_model=EvidenceResponse)
def verify_repair_evidence(
    evidence_id: str,
    verify_in: EvidenceVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Administrator verifies repair evidence photographs.
    Only after successful verification does the IssueGroup become RESOLVED.
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    issue = db.query(IssueGroup).filter(IssueGroup.id == evidence.issue_group_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    evidence.is_verified_by_admin = verify_in.is_verified
    evidence.verified_at = datetime.utcnow()

    if verify_in.is_verified:
        old_status = issue.status
        issue.status = IssueStatus.RESOLVED.value
        issue.resolved_at = datetime.utcnow()

        # Update all linked reports to RESOLVED
        for report in issue.reports:
            report.status = ReportStatus.RESOLVED.value

        # Update assignments to COMPLETED
        for assignment in issue.assignments:
            assignment.status = AssignmentStatus.COMPLETED.value
            assignment.completed_at = datetime.utcnow()

        # Record verified resolution in status history
        history = StatusHistory(
            issue_group_id=issue.id,
            changed_by_user_id=current_user.id,
            from_status=old_status,
            to_status=IssueStatus.RESOLVED.value,
            remarks=f"Administrator {current_user.full_name} reviewed photographic evidence and verified successful resolution. Remarks: {verify_in.remarks or 'Approved'}"
        )
        db.add(history)

        # Notify all citizens!
        NotificationService.notify_issue_stakeholders(
            db=db,
            issue_group=issue,
            title="Issue Resolved! Please provide feedback",
            message=f"The repair for #{issue.reference_code} has been officially verified by municipal administrators. Tap to view evidence photos and rate the resolution."
        )
    else:
        # If admin rejects repair evidence, reopen task for field worker
        old_status = issue.status
        issue.status = IssueStatus.IN_PROGRESS.value

        history = StatusHistory(
            issue_group_id=issue.id,
            changed_by_user_id=current_user.id,
            from_status=old_status,
            to_status=IssueStatus.IN_PROGRESS.value,
            remarks=f"Administrator rejected repair evidence. Task sent back to field worker. Reason: {verify_in.remarks or 'Inadequate repair'}"
        )
        db.add(history)

    db.commit()
    db.refresh(evidence)
    return evidence

