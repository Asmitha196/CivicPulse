import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_group_id = Column(String(36), ForeignKey("issue_groups.id"), nullable=False, index=True)
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    request_reopen = Column(Boolean, default=False)
    reopen_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    issue_group = relationship("IssueGroup", back_populates="feedback")
    citizen = relationship("User", back_populates="feedbacks")

