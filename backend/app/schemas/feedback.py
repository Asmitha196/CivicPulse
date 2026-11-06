from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserResponse

class FeedbackCreate(BaseModel):
    issue_group_id: str
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None
    request_reopen: Optional[bool] = False
    reopen_reason: Optional[str] = None

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_group_id: str
    citizen_id: str
    rating: int
    comments: Optional[str] = None
    request_reopen: bool
    reopen_reason: Optional[str] = None
    created_at: datetime
    citizen: Optional[UserResponse] = None
