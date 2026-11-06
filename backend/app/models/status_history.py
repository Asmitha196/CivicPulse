import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=False, index=True)
    changed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    issue_group = relationship("IssueGroup", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])

