import logging
from sqlalchemy.orm import Session
from app.models.notification import Notification

logger = logging.getLogger("civicpulse.notification")

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "STATUS_UPDATE",
        issue_group_id: str = None,
        report_id: str = None
    ) -> Notification:
        try:
            notif = Notification(
                user_id=user_id,
                issue_group_id=issue_group_id,
                report_id=report_id,
                title=title,
                message=message,
                notification_type=notification_type,
                is_read=False
            )
            db.add(notif)
            db.commit()
            db.refresh(notif)
            return notif
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
            db.rollback()
            return None

    @staticmethod
    def notify_issue_stakeholders(
        db: Session,
        issue_group,
        title: str,
        message: str,
        notification_type: str = "STATUS_UPDATE"
    ):
        """Notifies all citizens who reported complaints linked to this IssueGroup."""
        if not issue_group or not issue_group.reports:
            return

        notified_users = set()
        for report in issue_group.reports:
            if report.citizen_id and report.citizen_id not in notified_users:
                NotificationService.create_notification(
                    db=db,
                    user_id=report.citizen_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    issue_group_id=issue_group.id,
                    report_id=report.id
                )
                notified_users.add(report.citizen_id)

