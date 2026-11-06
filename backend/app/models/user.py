import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base

class RoleEnum(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"
    WORKER = "worker"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(20), default=RoleEnum.CITIZEN.value, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("Report", back_populates="citizen", foreign_keys="Report.citizen_id")
    worker_assignments = relationship("Assignment", back_populates="worker", foreign_keys="Assignment.worker_id")
    feedbacks = relationship("Feedback", back_populates="citizen")
    notifications = relationship("Notification", back_populates="user")

