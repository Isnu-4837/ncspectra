from typing import Optional
from pydantic import BaseModel


class OfficerOut(BaseModel):
    id: int
    badge_number: str
    name: str
    zone: str
    division: str
    rank: str
    unit: str
    status: str
    device_model: str
    encryption_standard: str
    battery_percent: int
    gps_accuracy: str
    offline_ready: bool

    model_config = {"from_attributes": True}


class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    division: Optional[str] = None
    rank: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    battery_percent: Optional[int] = None
    gps_accuracy: Optional[str] = None
