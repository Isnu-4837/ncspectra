from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CoordinatesOut(BaseModel):
    lat: float
    lng: float
    label: str


class SeizureRecordCreate(BaseModel):
    officer_name: Optional[str] = None
    officer_badge_number: Optional[str] = None
    reagent_name: str
    location: str
    live_location: Optional[str] = None
    image_name: Optional[str] = None
    status: str                      # POSITIVE | INCONCLUSIVE | NEGATIVE
    compound_name: str
    match_score: str
    accent_color: Optional[str] = "#ba1a1a"
    evidence_seal: Optional[str] = None
    sha256: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_label: Optional[str] = None


class SeizureRecordOut(BaseModel):
    id: str
    case_number: str
    officer_id: int
    officer_name: Optional[str] = None
    officer_badge_number: Optional[str] = None
    reagent_name: str
    location: str
    live_location: Optional[str] = None
    image_name: Optional[str] = None
    status: str
    compound_name: str
    match_score: str
    accent_color: str
    custodian_id: Optional[str] = None
    evidence_seal: Optional[str] = None
    sha256: Optional[str] = None
    timestamp_utc: datetime
    coordinates: Optional[CoordinatesOut] = None
    synced_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Flatten coordinates from lat/lng columns back into nested object
        data = super().model_validate(obj, *args, **kwargs)
        if obj.lat is not None and obj.lng is not None:
            data.coordinates = CoordinatesOut(
                lat=obj.lat,
                lng=obj.lng,
                label=obj.location_label or obj.location,
            )
        return data


class SeizureRecordStatusUpdate(BaseModel):
    status: str
    synced_at: Optional[datetime] = None
