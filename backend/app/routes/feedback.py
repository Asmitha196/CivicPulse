from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User, RoleEnum
from app.models.issue_group import IssueGroup, IssueStatus
from app.models.feedback import Feedback
from app.models.status_history import StatusHistory
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.notification_service import NotificationService
from app.middleware.auth import get_current_user, require_citizen

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse)
def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    issue = db.query(IssueGroup).filter(IssueGroup.id == feedback_in.issue_group_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue group not found.")

    feedback = Feedback(
        issue_group_id=issue.id,
        citizen_id=current_user.id,
        rating=feedback_in.rating,
        comments=feedback_in.comments,
        request_reopen=feedback_in.request_reopen or False,
        reopen_reason=feedback_in.reopen_reason
    )
    db.add(feedback)

    # If citizen requests reopen
    if feedback_in.request_reopen:
        old_status = issue.status
        issue.status = IssueStatus.REOPENED.value
        issue.resolved_at = None

        history = StatusHistory(
            issue_group_id=issue.id,
            changed_by_user_id=current_user.id,
            from_status=old_status,
            to_status=IssueStatus.REOPENED.value,
            remarks=f"Citizen {current_user.full_name} submitted resolution feedback and requested reopening: '{feedback_in.reopen_reason or feedback_in.comments}'"
        )
        db.add(history)

    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/{issue_group_id}", response_model=List[FeedbackResponse])
def get_issue_feedbacks(
    issue_group_id: str,
    db: Session = Depends(get_db)
):
    feedbacks = db.query(Feedback).options(
        joinedload(Feedback.citizen)
    ).filter(
        Feedback.issue_group_id == issue_group_id
    ).order_by(Feedback.created_at.desc()).all()
    return feedbacks

