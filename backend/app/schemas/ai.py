from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AIClassifyRequest(BaseModel):
    text: str
    image_url: Optional[str] = None

class AIClassifyResponse(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    confidence: float
    model_name: str
    is_fallback: bool
    suggestions: List[Dict[str, Any]]

class AIDetectDuplicatesRequest(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    category_id: Optional[str] = None

class PotentialDuplicateItem(BaseModel):
    issue_group_id: str
    reference_code: str
    title: str
    description: str
    distance_meters: float
    similarity_score: float
    category_name: str
    status: str
    created_at: str

class AIDetectDuplicatesResponse(BaseModel):
    has_potential_duplicates: bool
    duplicates: List[PotentialDuplicateItem]
    model_name: str
    is_fallback: bool

class AIPriorityRequest(BaseModel):
    description: str
    category: Optional[str] = None
    affected_count: Optional[int] = 1

class AIPriorityResponse(BaseModel):
    suggested_priority: str
    reasoning: str
    confidence: float
    factors: Dict[str, Any]
    model_name: str
    is_fallback: bool

