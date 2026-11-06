import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="alert-circle")
    default_sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    issue_groups = relationship("IssueGroup", back_populates="category")
    reports = relationship("Report", back_populates="category")

