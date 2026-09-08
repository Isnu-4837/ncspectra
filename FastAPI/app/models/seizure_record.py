from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class SeizureRecord(Base):
    __tablename__ = "seizure_records"

    id = Column(String, primary_key=True, index=True)          # e.g. "ncb-891"
    case_number = Column(String, unique=True, index=True)       # e.g. "#NCB-2024-0891"
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=False)
    officer_name = Column(String)
    officer_badge_number = Column(String)
    reagent_name = Column(String)
    location = Column(String)
    live_location = Column(String)
    image_name = Column(String)
    status = Column(String, default="POSITIVE")                 # POSITIVE | INCONCLUSIVE | NEGATIVE
    compound_name = Column(String)
    match_score = Column(String)
    accent_color = Column(String, default="#ba1a1a")

    custodian_id = Column(String)
    evidence_seal = Column(String)
    sha256 = Column(String)
    timestamp_utc = Column(DateTime, default=datetime.now)

    lat = Column(Float)
    lng = Column(Float)
    location_label = Column(String)

    synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    officer = relationship("Officer", back_populates="records")
    analysis = relationship("AnalysisResult", back_populates="record", uselist=False)
