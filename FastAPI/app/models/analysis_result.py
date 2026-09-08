from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, ForeignKey("seizure_records.id"), nullable=False)
    reagent_id = Column(String, ForeignKey("reagents.id"), nullable=False)

    spectral_match = Column(Float)          # e.g. 91.2
    purity_index = Column(Float)            # e.g. 88.7
    confidence = Column(Float)              # e.g. 94.1
    std_dev = Column(Float)                 # e.g. 0.03
    reaction_threshold_exceeded = Column(Boolean, default=True)
    peak_wavelength = Column(String)        # e.g. "546.2 nm"
    absorbance = Column(String)             # e.g. "0.84 A"
    raw_delta_e = Column(Float)

    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    record = relationship("SeizureRecord", back_populates="analysis")
