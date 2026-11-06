from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.category import Category
from app.models.issue_group import IssueGroup
from app.schemas.ai import (
    AIClassifyRequest, AIClassifyResponse,
    AIDetectDuplicatesRequest, AIDetectDuplicatesResponse,
    AIPriorityRequest, AIPriorityResponse
)
from app.services.ai_service import AIService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine"])

@router.post("/classify", response_model=AIClassifyResponse)
def classify_issue(
    req: AIClassifyRequest,
    db: Session = Depends(get_db)
):
    classification = AIService.classify_category(req.text)
    category_name = classification["category_name"]
    category = db.query(Category).filter(Category.name.ilike(f"%{category_name}%")).first()
    
    return {
        "category_id": category.id if category else None,
        "category_name": category_name,
        "confidence": classification["confidence"],
        "model_name": classification["model_name"],
        "is_fallback": classification["is_fallback"],
        "suggestions": classification["suggestions"]
    }

@router.post("/detect-duplicates", response_model=AIDetectDuplicatesResponse)
def detect_duplicates(
    req: AIDetectDuplicatesRequest,
    db: Session = Depends(get_db)
):
    # Fetch all active IssueGroups
    active_groups = db.query(IssueGroup).filter(
        IssueGroup.status.notin_(["RESOLVED", "REJECTED"])
    ).all()

    result = AIService.find_potential_duplicates(
        new_title=req.title,
        new_description=req.description,
        new_lat=req.latitude,
        new_lon=req.longitude,
        existing_issue_groups=active_groups
    )
    return result

@router.post("/recommend-priority", response_model=AIPriorityResponse)
def recommend_priority(req: AIPriorityRequest):
    result = AIService.recommend_priority(
        description=req.description,
        category=req.category or "General",
        affected_count=req.affected_count or 1
    )
    return result

