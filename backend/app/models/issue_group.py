import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base

class IssueStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"
    REJECTED = "REJECTED"

class IssuePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IssueGroup(Base):
    __tablename__ = "issue_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)
    
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location_address = Column(String(255), nullable=True)

    status = Column(String(30), default=IssueStatus.REPORTED.value, nullable=False, index=True)
    priority = Column(String(20), default=IssuePriority.MEDIUM.value, nullable=False, index=True)
    priority_verified_by_admin = Column(Boolean, default=False)
    
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_remarks = Column(Text, nullable=True)
    
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="issue_groups")
    reports = relationship("Report", back_populates="issue_group", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="issue_group", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="issue_group", cascade="all, delete-orphan", order_by="desc(StatusHistory.created_at)")
    evidence = relationship("Evidence", back_populates="issue_group", cascade="all, delete-orphan", order_by="desc(Evidence.created_at)")
    feedback = relationship("Feedback", back_populates="issue_group", cascade="all, delete-orphan")
    merges = relationship("IssueGroupMerge", back_populates="primary_issue_group", cascade="all, delete-orphan")

