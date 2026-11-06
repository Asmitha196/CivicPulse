import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class EvidenceType(str, enum.Enum):
    BEFORE_REPAIR = "BEFORE_REPAIR"
    AFTER_REPAIR = "AFTER_REPAIR"
    INSPECTION = "INSPECTION"

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=False, index=True)
    uploaded_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    evidence_type = Column(String(30), default=EvidenceType.AFTER_REPAIR.value, nullable=False)
    image_url = Column(String(500), nullable=False)
    remarks = Column(Text, nullable=True)

    is_verified_by_admin = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    issue_group = relationship("IssueGroup", back_populates="evidence")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

