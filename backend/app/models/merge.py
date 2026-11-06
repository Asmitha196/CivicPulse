import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class MergeStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class IssueGroupMerge(Base):
    __tablename__ = "issue_group_merges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    primary_issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=False, index=True)
    secondary_report_id = Column(String(36), ForeignKey("reports.id"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    status = Column(String(30), default=MergeStatus.PENDING.value, nullable=False)
    similarity_score = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=False)
    admin_notes = Column(Text, nullable=True)
    action_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    primary_issue_group = relationship("IssueGroup", back_populates="merges")
    secondary_report = relationship("Report")
    admin = relationship("User")

