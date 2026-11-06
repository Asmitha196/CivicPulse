import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AISuggestion(Base):
    __tablename__ = "ai_suggestions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("reports.id"), unique=True, nullable=False, index=True)
    suggested_category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    category_confidence = Column(Float, default=0.0)
    
    suggested_priority = Column(String(20), default="MEDIUM")
    priority_reasoning = Column(Text, nullable=True)

    duplicate_detected = Column(Boolean, default=False, index=True)
    matched_issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=True, index=True)
    similarity_score = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)

    model_name = Column(String(100), default="Sentence-Transformers/all-MiniLM-L6-v2")
    raw_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("Report", back_populates="ai_suggestion")
    suggested_category = relationship("Category")
    matched_issue_group = relationship("IssueGroup")

