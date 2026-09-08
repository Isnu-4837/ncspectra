from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    icon: str
    title: str
    description: str
    time_display: str
    unread: bool
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationSummary(BaseModel):
    notifications: list[NotificationOut]
    unread_count: int
