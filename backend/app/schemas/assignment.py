from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserResponse
from app.schemas.issue_group import IssueGroupResponse

class AssignmentCreate(BaseModel):
    issue_group_id: str
    worker_id: str
    notes: Optional[str] = None

class AssignmentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_group_id: str
    worker_id: str
    assigned_by_id: str
    status: str
    notes: Optional[str] = None
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    worker: Optional[UserResponse] = None
    assigned_by: Optional[UserResponse] = None
    issue_group: Optional[IssueGroupResponse] = None
