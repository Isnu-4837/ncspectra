from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_officer, get_db
from app.models.notification import Notification
from app.models.officer import Officer
from app.schemas.notification import NotificationOut, NotificationSummary
from app.utils.domain import build_notification_id, build_time_display, next_numeric_suffix

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _serialize_notification(notification: Notification) -> NotificationOut:
    return NotificationOut.model_validate(notification)


def _summary(db: Session, officer_id: int) -> NotificationSummary:
    notifications = (
        db.query(Notification)
        .filter(Notification.officer_id == officer_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    unread_count = (
        db.query(Notification)
        .filter(Notification.officer_id == officer_id, Notification.unread.is_(True))
        .count()
    )
    return NotificationSummary(
        notifications=[_serialize_notification(notification) for notification in notifications],
        unread_count=unread_count,
    )


@router.get("/", response_model=NotificationSummary)
def list_notifications(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> NotificationSummary:
    return _summary(db, current_officer.id)


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> NotificationOut:
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.officer_id == current_officer.id,
        )
        .first()
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.unread = False
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return _serialize_notification(notification)


@router.post("/read-all", response_model=NotificationSummary)
def mark_all_read(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> NotificationSummary:
    notifications = (
        db.query(Notification)
        .filter(Notification.officer_id == current_officer.id, Notification.unread.is_(True))
        .all()
    )
    for notification in notifications:
        notification.unread = False
        db.add(notification)

    db.commit()
    return _summary(db, current_officer.id)


@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    title: str = Body(...),
    description: str = Body(...),
    icon: str = Body(default="notifications"),
    color: str = Body(default="#4edea3"),
    unread: bool = Body(default=True),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> NotificationOut:
    sequence = next_numeric_suffix((row[0] for row in db.query(Notification.id).all()), "n")
    now = datetime.now()
    notification = Notification(
        id=build_notification_id(sequence),
        officer_id=current_officer.id,
        icon=icon,
        title=title,
        description=description,
        time_display=build_time_display(now, now=now),
        unread=unread,
        color=color,
        created_at=now,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    return _serialize_notification(notification)
