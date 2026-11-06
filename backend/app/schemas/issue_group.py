from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.category import CategoryResponse
from app.schemas.auth import UserResponse

class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_group_id: str
    changed_by_user_id: str
    from_status: str
    to_status: str
    remarks: Optional[str] = None
    created_at: datetime
    changed_by: Optional[UserResponse] = None

class ReportSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    complaint_id: str
    citizen_id: str
    title: str
    description: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    status: str
    created_at: datetime
    citizen: Optional[UserResponse] = None

class IssueGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reference_code: str
    title: str
    description: str
    category_id: str
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    status: str
    priority: str
    priority_verified_by_admin: bool
    verified_by_user_id: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_remarks: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    reports_count: Optional[int] = 0
    reports: Optional[List[ReportSummary]] = []
    status_history: Optional[List[StatusHistoryResponse]] = []

class IssueVerifyRequest(BaseModel):
    priority: str
    verification_remarks: Optional[str] = None

class IssueMergeRequest(BaseModel):
    secondary_report_id: str
    admin_notes: Optional[str] = None
    status: Optional[str] = "APPROVED"  # APPROVED or REJECTED

class IssueReopenRequest(BaseModel):
    reopen_reason: str
