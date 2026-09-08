from typing import Optional
from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    reagent_id: str
    officer_badge: str
    officer_name: Optional[str] = None
    location: Optional[str] = "DEL-NORTH-HQ"
    live_location: Optional[str] = None
    image_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class AnalysisResultOut(BaseModel):
    """Returned immediately after spectral analysis; used by CaptureScreen/ResultsScreen."""
    case_id: str
    sha256: str
    compound_name: str
    compound_class: str
    spectral_match: float       # e.g. 91.2
    purity_index: float         # e.g. 88.7
    confidence: float           # e.g. 94.1
    std_dev: float              # e.g. 0.03
    reaction_threshold_exceeded: bool
    peak_wavelength: str
    absorbance: str
    delta_e: float
    status: str                 # POSITIVE | INCONCLUSIVE | NEGATIVE
    reagent_name: str
    reagent_id: str
    officer_name: Optional[str] = None
    officer_badge_number: Optional[str] = None
    live_location: Optional[str] = None
    image_name: Optional[str] = None
    timestamp_utc: str
