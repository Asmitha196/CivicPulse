from datetime import datetime
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.issue_group import IssueGroup, IssueStatus, IssuePriority
from app.models.report import Report
from app.models.category import Category
from app.models.assignment import Assignment, AssignmentStatus
from app.models.user import User, RoleEnum
from app.middleware.auth import require_admin

router = APIRouter(prefix="/admin/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Total reports submitted by citizens
    total_complaints = db.query(Report).count()
    
    # Issue group status breakdowns
    total_issues = db.query(IssueGroup).count()
    pending_complaints = db.query(IssueGroup).filter(
        IssueGroup.status.in_([IssueStatus.REPORTED.value, IssueStatus.REOPENED.value])
    ).count()
    verified_complaints = db.query(IssueGroup).filter(
        IssueGroup.status == IssueStatus.VERIFIED.value
    ).count()
    assigned_complaints = db.query(IssueGroup).filter(
        IssueGroup.status == IssueStatus.ASSIGNED.value
    ).count()
    in_progress_complaints = db.query(IssueGroup).filter(
        IssueGroup.status.in_([IssueStatus.IN_PROGRESS.value, IssueStatus.PENDING_VERIFICATION.value])
    ).count()
    resolved_complaints = db.query(IssueGroup).filter(
        IssueGroup.status == IssueStatus.RESOLVED.value
    ).count()

    # Critical issues count
    critical_issues = db.query(IssueGroup).filter(
        IssueGroup.priority == IssuePriority.CRITICAL.value,
        IssueGroup.status != IssueStatus.RESOLVED.value
    ).count()

    # Average resolution time in hours
    resolved_issues = db.query(IssueGroup).filter(
        IssueGroup.status == IssueStatus.RESOLVED.value,
        IssueGroup.resolved_at.isnot(None),
        IssueGroup.created_at.isnot(None)
    ).all()

    avg_resolution_hours = 0.0
    if resolved_issues:
        total_seconds = sum(
            abs((issue.resolved_at - issue.created_at).total_seconds())
            for issue in resolved_issues
            if issue.resolved_at and issue.created_at
        )
        avg_resolution_hours = round((total_seconds / len(resolved_issues)) / 3600.0, 1)

    # Complaints by category
    categories = db.query(Category).all()
    category_counts = []
    for cat in categories:
        count = db.query(Report).filter(Report.category_id == cat.id).count()
        category_counts.append({
            "category": cat.name,
            "count": count,
            "icon": cat.icon
        })

    # Complaints by locality / address keyword
    reports = db.query(Report).all()
    locality_map = defaultdict(int)
    for r in reports:
        loc = r.location_address or "Central Civic Zone"
        # Extract main street or neighborhood part
        main_part = loc.split(",")[0].strip() if "," in loc else loc.strip()
        locality_map[main_part] += 1
    
    top_localities = [
        {"locality": k, "count": v}
        for k, v in sorted(locality_map.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    # Monthly / Weekly trends (grouped by month string)
    monthly_map = defaultdict(int)
    for r in reports:
        if r.created_at:
            month_key = r.created_at.strftime("%b %Y")
            monthly_map[month_key] += 1
    
    monthly_trends = [
        {"month": k, "complaints": v}
        for k, v in monthly_map.items()
    ]
    if not monthly_trends:
        monthly_trends = [{"month": datetime.utcnow().strftime("%b %Y"), "complaints": total_complaints}]

    # Worker performance
    workers = db.query(User).filter(User.role == RoleEnum.WORKER.value).all()
    worker_performance = []
    for w in workers:
        total_assigned = db.query(Assignment).filter(Assignment.worker_id == w.id).count()
        completed = db.query(Assignment).filter(
            Assignment.worker_id == w.id,
            Assignment.status == AssignmentStatus.COMPLETED.value
        ).count()
        in_prog = db.query(Assignment).filter(
            Assignment.worker_id == w.id,
            Assignment.status.in_([AssignmentStatus.IN_PROGRESS.value, AssignmentStatus.ACCEPTED.value, AssignmentStatus.SUBMITTED.value])
        ).count()
        rate = round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0.0

        worker_performance.append({
            "id": w.id,
            "name": w.full_name,
            "phone": w.phone or "N/A",
            "total_tasks": total_assigned,
            "completed": completed,
            "in_progress": in_prog,
            "completion_rate": rate
        })

    return {
        "summary": {
            "total_complaints": total_complaints,
            "total_issue_groups": total_issues,
            "pending_complaints": pending_complaints,
            "verified_complaints": verified_complaints,
            "assigned_complaints": assigned_complaints,
            "in_progress_complaints": in_progress_complaints,
            "resolved_complaints": resolved_complaints,
            "critical_issues": critical_issues,
            "avg_resolution_hours": avg_resolution_hours
        },
        "by_category": category_counts,
        "by_locality": top_localities,
        "monthly_trends": monthly_trends,
        "worker_performance": worker_performance
    }
