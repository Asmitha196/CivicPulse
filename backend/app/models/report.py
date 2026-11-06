import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class ReportStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    LINKED = "LINKED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(50), unique=True, index=True, nullable=False)
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_address = Column(String(255), nullable=True)

    status = Column(String(30), default=ReportStatus.SUBMITTED.value, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    citizen = relationship("User", back_populates="reports")
    issue_group = relationship("IssueGroup", back_populates="reports")
    category = relationship("Category", back_populates="reports")
    ai_suggestion = relationship("AISuggestion", back_populates="report", uselist=False, cascade="all, delete-orphan")

