from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserResponse

class EvidenceCreate(BaseModel):
    issue_group_id: str
    evidence_type: str  # BEFORE_REPAIR, AFTER_REPAIR, INSPECTION
    image_url: str
    remarks: Optional[str] = None

class EvidenceVerifyRequest(BaseModel):
    is_verified: bool
    remarks: Optional[str] = None

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_group_id: str
    uploaded_by_id: str
    evidence_type: str
    image_url: str
    remarks: Optional[str] = None
    is_verified_by_admin: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    uploaded_by: Optional[UserResponse] = None
