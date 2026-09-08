from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_officer, get_db
from app.models.officer import Officer
from app.models.seizure_record import SeizureRecord
from app.schemas.seizure_record import (
    SeizureRecordCreate,
    SeizureRecordOut,
    SeizureRecordStatusUpdate,
)
from app.utils.domain import (
    build_case_number,
    build_custodian_id,
    build_image_name,
    build_record_id,
    build_sha256,
    next_numeric_suffix,
)

router = APIRouter(prefix="/records", tags=["records"])

ALLOWED_STATUSES = {"POSITIVE", "INCONCLUSIVE", "NEGATIVE"}


def _serialize_record(record: SeizureRecord) -> SeizureRecordOut:
    return SeizureRecordOut.model_validate(record)


@router.get("/", response_model=list[SeizureRecordOut])
def list_records(
    limit: int = Query(default=20, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    synced: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> list[SeizureRecordOut]:
    query = db.query(SeizureRecord).filter(SeizureRecord.officer_id == current_officer.id)

    if status_filter:
        query = query.filter(SeizureRecord.status == status_filter.upper())

    if synced is True:
        query = query.filter(SeizureRecord.synced_at.isnot(None))
    elif synced is False:
        query = query.filter(SeizureRecord.synced_at.is_(None))

    records = query.order_by(SeizureRecord.timestamp_utc.desc()).limit(limit).all()
    return [_serialize_record(record) for record in records]


@router.get("/{record_id}", response_model=SeizureRecordOut)
def get_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> SeizureRecordOut:
    record = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.id == record_id,
            SeizureRecord.officer_id == current_officer.id,
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return _serialize_record(record)


@router.post("/", response_model=SeizureRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    payload: SeizureRecordCreate,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> SeizureRecordOut:
    sequence = next_numeric_suffix(
        (row[0] for row in db.query(SeizureRecord.id).all()),
        "ncb-",
    )
    now = datetime.now()
    status_value = payload.status.strip().upper()

    if status_value not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be POSITIVE, INCONCLUSIVE, or NEGATIVE",
        )

    record = SeizureRecord(
        id=build_record_id(sequence),
        case_number=build_case_number(sequence, now),
        officer_id=current_officer.id,
        officer_name=payload.officer_name or current_officer.name,
        officer_badge_number=payload.officer_badge_number or current_officer.badge_number,
        reagent_name=payload.reagent_name,
        location=payload.location,
        live_location=payload.live_location or payload.location,
        image_name=payload.image_name or build_image_name(payload.reagent_name or "capture", now),
        status=status_value,
        compound_name=payload.compound_name,
        match_score=payload.match_score,
        accent_color=payload.accent_color or "#ba1a1a",
        custodian_id=build_custodian_id(current_officer.badge_number),
        evidence_seal=payload.evidence_seal or f"#NC-{sequence:04d}-EVD",
        sha256=payload.sha256
        or build_sha256(
            [
                current_officer.badge_number,
                current_officer.name,
                payload.reagent_name,
                payload.location,
                payload.live_location or payload.location,
                payload.image_name or build_image_name(payload.reagent_name or "capture", now),
                payload.compound_name,
                now.isoformat(),
            ]
        ),
        timestamp_utc=now,
        lat=payload.lat,
        lng=payload.lng,
        location_label=payload.location_label,
        synced_at=None,
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_record(record)


@router.post("/{record_id}/status", response_model=SeizureRecordOut)
def update_record_status(
    record_id: str,
    payload: SeizureRecordStatusUpdate,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> SeizureRecordOut:
    record = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.id == record_id,
            SeizureRecord.officer_id == current_officer.id,
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    status_value = payload.status.strip().upper()
    if status_value not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be POSITIVE, INCONCLUSIVE, or NEGATIVE",
        )

    record.status = status_value
    if payload.synced_at is not None:
        record.synced_at = payload.synced_at

    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_record(record)
