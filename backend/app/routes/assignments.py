from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User, RoleEnum
from app.models.issue_group import IssueGroup, IssueStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.status_history import StatusHistory
from app.schemas.assignment import (
    AssignmentCreate, AssignmentStatusUpdate, AssignmentResponse
)
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, require_admin, require_worker

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("", response_model=AssignmentResponse)
def create_assignment(
    assign_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    issue = db.query(IssueGroup).filter(IssueGroup.id == assign_in.issue_group_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    worker = db.query(User).filter(
        User.id == assign_in.worker_id,
        User.role == RoleEnum.WORKER.value
    ).first()
    if not worker:
        raise HTTPException(status_code=400, detail="Worker user not found or not a field worker.")

    # Create assignment
    assignment = Assignment(
        issue_group_id=issue.id,
        worker_id=worker.id,
        assigned_by_id=current_user.id,
        status=AssignmentStatus.PENDING.value,
        notes=assign_in.notes
    )
    db.add(assignment)

    # Update issue group status to ASSIGNED
    old_status = issue.status
    issue.status = IssueStatus.ASSIGNED.value

    history = StatusHistory(
        issue_group_id=issue.id,
        changed_by_user_id=current_user.id,
        from_status=old_status,
        to_status=IssueStatus.ASSIGNED.value,
        remarks=f"Assigned to field worker {worker.full_name}. Notes: {assign_in.notes or 'None'}"
    )
    db.add(history)

    # Notify worker
    NotificationService.create_notification(
        db=db,
        user_id=worker.id,
        title="New Civic Task Assigned",
        message=f"You have been assigned to repair #{issue.reference_code} ({issue.title}).",
        notification_type="TASK_ASSIGNED",
        issue_group_id=issue.id
    )

    # Notify citizens
    NotificationService.notify_issue_stakeholders(
        db=db,
        issue_group=issue,
        title="Worker Dispatched",
        message=f"A municipal field technician ({worker.full_name}) has been dispatched for #{issue.reference_code}."
    )

    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/my-tasks", response_model=List[AssignmentResponse])
def get_my_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    query = db.query(Assignment).options(
        joinedload(Assignment.issue_group).joinedload(IssueGroup.category),
        joinedload(Assignment.issue_group).joinedload(IssueGroup.reports),
        joinedload(Assignment.worker),
        joinedload(Assignment.assigned_by)
    ).filter(
        Assignment.worker_id == current_user.id
    )

    if status_filter:
        query = query.filter(Assignment.status == status_filter)

    return query.order_by(Assignment.assigned_at.desc()).all()

@router.patch("/{assignment_id}/status", response_model=AssignmentResponse)
def update_task_status(
    assignment_id: str,
    update_in: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker)
):
    assignment = db.query(Assignment).options(
        joinedload(Assignment.issue_group)
    ).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Restrict to assigned worker or admin
    if current_user.role == RoleEnum.WORKER.value and assignment.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to update this assignment.")

    old_assign_status = assignment.status
    assignment.status = update_in.status
    if update_in.notes:
        assignment.notes = f"{assignment.notes or ''}\n[Update]: {update_in.notes}".strip()

    issue = assignment.issue_group
    old_issue_status = issue.status

    if update_in.status == AssignmentStatus.ACCEPTED.value:
        assignment.accepted_at = datetime.utcnow()
    elif update_in.status == AssignmentStatus.IN_PROGRESS.value:
        issue.status = IssueStatus.IN_PROGRESS.value
    elif update_in.status == AssignmentStatus.SUBMITTED.value:
        issue.status = IssueStatus.PENDING_VERIFICATION.value
        assignment.completed_at = datetime.utcnow()
    elif update_in.status == AssignmentStatus.COMPLETED.value:
        assignment.completed_at = datetime.utcnow()

    history = StatusHistory(
        issue_group_id=issue.id,
        changed_by_user_id=current_user.id,
        from_status=old_issue_status,
        to_status=issue.status,
        remarks=f"Worker {current_user.full_name} updated task status to {update_in.status}. Remarks: {update_in.notes or 'None'}"
    )
    db.add(history)

    NotificationService.notify_issue_stakeholders(
        db=db,
        issue_group=issue,
        title=f"Repair Status: {issue.status}",
        message=f"Field technician update for #{issue.reference_code}: status is now {issue.status}."
    )

    db.commit()
    db.refresh(assignment)
    return assignment

