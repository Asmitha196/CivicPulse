import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AssignmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    COMPLETED = "COMPLETED"
    REASSIGNED = "REASSIGNED"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=False, index=True)
    worker_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    status = Column(String(30), default=AssignmentStatus.PENDING.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    issue_group = relationship("IssueGroup", back_populates="assignments")
    worker = relationship("User", foreign_keys=[worker_id], back_populates="worker_assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

