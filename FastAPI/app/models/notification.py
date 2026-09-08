from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=False)

    icon = Column(String, default="notifications")
    title = Column(String, nullable=False)
    description = Column(String)
    time_display = Column(String)
    unread = Column(Boolean, default=True)
    color = Column(String, default="#4edea3")

    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    officer = relationship("Officer", back_populates="notifications")
