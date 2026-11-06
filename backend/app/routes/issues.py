from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User, RoleEnum
from app.models.issue_group import IssueGroup, IssueStatus, IssuePriority
from app.models.report import Report, ReportStatus
from app.models.status_history import StatusHistory
from app.models.merge import IssueGroupMerge, MergeStatus
from app.schemas.issue_group import (
    IssueGroupResponse, IssueVerifyRequest, IssueMergeRequest, IssueReopenRequest
)
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/issues", tags=["Issue Groups"])

@router.get("", response_model=List[IssueGroupResponse])
def get_issue_groups(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(IssueGroup).options(
        joinedload(IssueGroup.category),
        joinedload(IssueGroup.reports).joinedload(Report.citizen),
        joinedload(IssueGroup.status_history).joinedload(StatusHistory.changed_by)
    )

    if status_filter:
        query = query.filter(IssueGroup.status == status_filter)
    if category_id:
        query = query.filter(IssueGroup.category_id == category_id)
    if priority:
        query = query.filter(IssueGroup.priority == priority)

    issues = query.order_by(IssueGroup.created_at.desc()).all()

    # Inject reports count
    for issue in issues:
        issue.reports_count = len(issue.reports) if issue.reports else 0

    return issues

@router.get("/{issue_id}", response_model=IssueGroupResponse)
def get_issue_by_id(
    issue_id: str,
    db: Session = Depends(get_db)
):
    issue = db.query(IssueGroup).options(
        joinedload(IssueGroup.category),
        joinedload(IssueGroup.reports).joinedload(Report.citizen),
        joinedload(IssueGroup.status_history).joinedload(StatusHistory.changed_by)
    ).filter(
        (IssueGroup.id == issue_id) | (IssueGroup.reference_code == issue_id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    issue.reports_count = len(issue.reports) if issue.reports else 0
    return issue

@router.post("/{issue_id}/verify", response_model=IssueGroupResponse)
def verify_issue(
    issue_id: str,
    verify_in: IssueVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Administrator verifies issue severity and sets final priority.
    Moves status to VERIFIED if in REPORTED or REOPENED state.
    """
    issue = db.query(IssueGroup).filter(IssueGroup.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    # Validate priority value
    if verify_in.priority not in [p.value for p in IssuePriority]:
        raise HTTPException(status_code=400, detail=f"Invalid priority level {verify_in.priority}")

    old_status = issue.status
    old_priority = issue.priority

    issue.priority = verify_in.priority
    issue.priority_verified_by_admin = True
    issue.verified_by_user_id = current_user.id
    issue.verified_at = datetime.utcnow()
    issue.verification_remarks = verify_in.verification_remarks

    new_status = IssueStatus.VERIFIED.value if issue.status in [IssueStatus.REPORTED.value, IssueStatus.REOPENED.value] else issue.status
    issue.status = new_status

    # Record in status history
    history = StatusHistory(
        issue_group_id=issue.id,
        changed_by_user_id=current_user.id,
        from_status=old_status,
        to_status=new_status,
        remarks=f"Administrator verified issue. Priority set from {old_priority} to {verify_in.priority}. Remarks: {verify_in.verification_remarks or 'None'}"
    )
    db.add(history)

    # Notify affected citizens
    NotificationService.notify_issue_stakeholders(
        db=db,
        issue_group=issue,
        title="Issue Verified by Municipality",
        message=f"Your reported issue ({issue.reference_code}) has been verified and assigned priority {verify_in.priority}."
    )

    db.commit()
    db.refresh(issue)
    issue.reports_count = len(issue.reports) if issue.reports else 0
    return issue

@router.post("/{issue_id}/merge", response_model=IssueGroupResponse)
def merge_duplicate_report(
    issue_id: str,
    merge_in: IssueMergeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Administrator reviews and approves duplicate grouping.
    Links a duplicate report into this primary IssueGroup.
    """
    primary_issue = db.query(IssueGroup).filter(IssueGroup.id == issue_id).first()
    if not primary_issue:
        raise HTTPException(status_code=404, detail="Primary issue group not found.")

    secondary_report = db.query(Report).filter(
        (Report.id == merge_in.secondary_report_id) | (Report.complaint_id == merge_in.secondary_report_id)
    ).first()
    if not secondary_report:
        raise HTTPException(status_code=404, detail="Secondary report to merge not found.")

    if secondary_report.issue_group_id == primary_issue.id:
        raise HTTPException(status_code=400, detail="This report is already linked to the specified issue group.")

    old_issue_group_id = secondary_report.issue_group_id

    # Record merge audit log
    merge_record = IssueGroupMerge(
        primary_issue_group_id=primary_issue.id,
        secondary_report_id=secondary_report.id,
        admin_id=current_user.id,
        status=MergeStatus.APPROVED.value if merge_in.status == "APPROVED" else MergeStatus.REJECTED.value,
        similarity_score=secondary_report.ai_suggestion.similarity_score if secondary_report.ai_suggestion else 0.85,
        distance_meters=secondary_report.ai_suggestion.distance_meters if secondary_report.ai_suggestion else 25.0,
        admin_notes=merge_in.admin_notes or "Merged duplicate into primary group."
    )
    db.add(merge_record)

    if merge_in.status == "APPROVED":
        # Link secondary report to primary issue group
        secondary_report.issue_group_id = primary_issue.id
        secondary_report.status = ReportStatus.LINKED.value

        # Status history on primary issue group
        history = StatusHistory(
            issue_group_id=primary_issue.id,
            changed_by_user_id=current_user.id,
            from_status=primary_issue.status,
            to_status=primary_issue.status,
            remarks=f"Admin grouped duplicate citizen report #{secondary_report.complaint_id} into this issue group. Notes: {merge_in.admin_notes or 'Approved by admin'}"
        )
        db.add(history)

        # Notify secondary citizen
        NotificationService.create_notification(
            db=db,
            user_id=secondary_report.citizen_id,
            title="Complaint Linked to Active Issue Group",
            message=f"Your complaint #{secondary_report.complaint_id} has been verified as related to active municipal task #{primary_issue.reference_code}.",
            notification_type="DUPLICATE_LINKED",
            issue_group_id=primary_issue.id,
            report_id=secondary_report.id
        )

        # If the secondary report had an empty standalone group, mark that group as merged/resolved
        if old_issue_group_id:
            old_group = db.query(IssueGroup).filter(IssueGroup.id == old_issue_group_id).first()
            if old_group and len(old_group.reports) <= 1:
                old_group.status = IssueStatus.REJECTED.value
                old_group.verification_remarks = f"Merged into primary issue {primary_issue.reference_code}."

    db.commit()
    db.refresh(primary_issue)
    primary_issue.reports_count = len(primary_issue.reports) if primary_issue.reports else 0
    return primary_issue

@router.post("/{issue_id}/reopen", response_model=IssueGroupResponse)
def reopen_issue(
    issue_id: str,
    reopen_in: IssueReopenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(IssueGroup).filter(IssueGroup.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    old_status = issue.status
    issue.status = IssueStatus.REOPENED.value
    issue.resolved_at = None

    history = StatusHistory(
        issue_group_id=issue.id,
        changed_by_user_id=current_user.id,
        from_status=old_status,
        to_status=IssueStatus.REOPENED.value,
        remarks=f"Issue reopened by {current_user.full_name} ({current_user.role}). Reason: {reopen_in.reopen_reason}"
    )
    db.add(history)

    NotificationService.notify_issue_stakeholders(
        db=db,
        issue_group=issue,
        title="Issue Reopened",
        message=f"Issue #{issue.reference_code} has been reopened for additional inspection: {reopen_in.reopen_reason}."
    )

    db.commit()
    db.refresh(issue)
    issue.reports_count = len(issue.reports) if issue.reports else 0
    return issue

