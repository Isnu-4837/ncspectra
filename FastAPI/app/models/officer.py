from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String, unique=True, index=True, nullable=False)  # e.g. NCB-DEL-9842
    name = Column(String, nullable=False)
    zone = Column(String, default="NCB Delhi Zone")
    division = Column(String, default="Special Enforcement Branch")
    rank = Column(String, default="Sub-Inspector")
    unit = Column(String, default="Special Enforcement Branch")
    status = Column(String, default="ACTIVE")  # ACTIVE | OFFLINE | DISPATCHED

    device_model = Column(String, default="Pixel 8 Tactical (Hardened OS)")
    encryption_standard = Column(String, default="256-Bit Hardware AES")
    battery_percent = Column(Integer, default=84)
    gps_accuracy = Column(String, default="+/-3m")
    offline_ready = Column(Boolean, default=True)

    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    records = relationship("SeizureRecord", back_populates="officer")
    notifications = relationship("Notification", back_populates="officer")
