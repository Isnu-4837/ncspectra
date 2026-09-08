from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_officer, get_db
from app.models.notification import Notification
from app.models.officer import Officer
from app.models.seizure_record import SeizureRecord
from app.schemas.officer import OfficerOut
from app.schemas.seizure_record import SeizureRecordOut

router = APIRouter(tags=["system"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, object]:
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "service": "ncspectra-backend",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@router.get("/info")
def info() -> dict[str, object]:
    return {
        "name": "NCSpectra Tactical Field Backend",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "database_url": settings.DATABASE_URL.split(":", 1)[0],
    }


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> dict[str, object]:
    start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    base_query = db.query(SeizureRecord).filter(SeizureRecord.officer_id == current_officer.id)

    recent_records = base_query.order_by(SeizureRecord.timestamp_utc.desc()).limit(5).all()

    tests_today = base_query.filter(SeizureRecord.created_at >= start_of_day).count()
    positive_count = base_query.filter(SeizureRecord.status == "POSITIVE").count()
    inconclusive_count = base_query.filter(SeizureRecord.status == "INCONCLUSIVE").count()
    negative_count = base_query.filter(SeizureRecord.status == "NEGATIVE").count()
    pending_sync_count = base_query.filter(SeizureRecord.synced_at.is_(None)).count()
    synced_count = base_query.filter(SeizureRecord.synced_at.isnot(None)).count()

    latest_sync = (
        base_query.filter(SeizureRecord.synced_at.isnot(None))
        .order_by(SeizureRecord.synced_at.desc())
        .first()
    )

    unread_notifications = (
        db.query(Notification)
        .filter(Notification.officer_id == current_officer.id, Notification.unread.is_(True))
        .count()
    )

    return {
        "officer": OfficerOut.model_validate(current_officer).model_dump(mode="json"),
        "tests_today": tests_today,
        "positive_count": positive_count,
        "inconclusive_count": inconclusive_count,
        "negative_count": negative_count,
        "pending_sync_count": pending_sync_count,
        "synced_count": synced_count,
        "unread_notifications": unread_notifications,
        "last_sync_at": latest_sync.synced_at.isoformat() if latest_sync and latest_sync.synced_at else None,
        "recent_records": [
            SeizureRecordOut.model_validate(record).model_dump(mode="json")
            for record in recent_records
        ],
    }


@router.get("/sync/summary")
def sync_summary(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> dict[str, object]:
    pending_records = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.officer_id == current_officer.id,
            SeizureRecord.synced_at.is_(None),
        )
        .order_by(SeizureRecord.timestamp_utc.desc())
        .all()
    )
    latest_sync = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.officer_id == current_officer.id,
            SeizureRecord.synced_at.isnot(None),
        )
        .order_by(SeizureRecord.synced_at.desc())
        .first()
    )

    return {
        "pending_sync_count": len(pending_records),
        "synced_count": (
            db.query(SeizureRecord)
            .filter(
                SeizureRecord.officer_id == current_officer.id,
                SeizureRecord.synced_at.isnot(None),
            )
            .count()
        ),
        "last_sync_at": latest_sync.synced_at.isoformat() if latest_sync and latest_sync.synced_at else None,
        "pending_records": [
            SeizureRecordOut.model_validate(record).model_dump(mode="json")
            for record in pending_records
        ],
    }


@router.post("/sync/flush")
def sync_flush(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> dict[str, object]:
    pending_records = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.officer_id == current_officer.id,
            SeizureRecord.synced_at.is_(None),
        )
        .all()
    )
    now = datetime.now()

    for record in pending_records:
        record.synced_at = now
        db.add(record)

    db.commit()

    return {
        "status": "ok",
        "synced_count": len(pending_records),
        "pending_sync_count": 0,
        "last_sync_at": now.isoformat() if pending_records else None,
        "synced_records": [
            SeizureRecordOut.model_validate(record).model_dump(mode="json")
            for record in pending_records
        ],
    }
