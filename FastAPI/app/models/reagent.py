from sqlalchemy import Column, Float, Integer, String, Text

from app.database import Base


class Reagent(Base):
    __tablename__ = "reagents"

    id = Column(String, primary_key=True, index=True)   # e.g. "marquis"
    name = Column(String, nullable=False)
    cat_number = Column(String)                          # e.g. "CAT #R-01"
    exp_date = Column(String)                            # e.g. "11/2025"
    category = Column(String, index=True)                # opiates | stimulants | cannabinoids | synthetics
    category_label = Column(String)
    description = Column(Text)
    substances = Column(Text)                            # JSON-encoded list
    target_reaction = Column(String)
    color_hex = Column(String)
    color_gradient = Column(String)
    primary_match_name = Column(String)
    confidence_score = Column(Float)
    delta_e = Column(Float)
    peak_wavelength = Column(String)
    absorbance = Column(String)
