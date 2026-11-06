from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.category import CategoryResponse

class ReportCreate(BaseModel):
    title: str
    description: str
    category_id: str
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    image_url: Optional[str] = None

class AISuggestionCompact(BaseModel):
    suggested_category_id: Optional[str] = None
    category_confidence: float
    suggested_priority: str
    priority_reasoning: Optional[str] = None
    duplicate_detected: bool
    matched_issue_group_id: Optional[str] = None
    similarity_score: Optional[float] = None
    distance_meters: Optional[float] = None
    model_name: str

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: str
    complaint_id: str
    citizen_id: str
    issue_group_id: Optional[str] = None
    category_id: str
    title: str
    description: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    location_address: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    ai_suggestion: Optional[AISuggestionCompact] = None

    class Config:
        from_attributes = True

