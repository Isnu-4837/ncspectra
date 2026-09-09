"""
Batch sync endpoint for offline-captured seizure records.

Mounts under /api/sync and is the counterpart to the mobile app's
`getPendingRecords()` / `deleteRecordsByLocalIds()` (see Offlinedb.ts) and
`syncService.ts`. Mobile sends everything sitting in local SQLite with
sync_status = 0; this endpoint creates the authoritative server rows and
tells the client which local rows are now safe to erase.

Route: POST /api/sync/batch
Auth:  Bearer JWT (same token issued by POST /api/auth/login)
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional, Tuple

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis_result import AnalysisResult
from app.models.officer import Officer
from app.models.seizure_record import SeizureRecord
from app.dependencies import get_current_officer

router = APIRouter(prefix="/api/sync", tags=["sync"])


# ---------------------------------------------------------------------------
# Schemas — mirror LocalSeizureRecord / LocalAnalysisResult from Offlinedb.ts
# ---------------------------------------------------------------------------

class SyncAnalysisIn(BaseModel):
    reagent_id: str
    spectral_match: float
    purity_index: float
    raw_delta_e: float
    confidence: float


class SyncRecordIn(BaseModel):
    local_id: str = Field(..., description="Client-generated UUID; echoed back so the app knows which row to erase.")
    compound_name: str
    reagent_id: str
    reagent_name: str
    officer_name: str
    officer_badge_number: str
    location: str
    live_location: str
    image_name: Optional[str] = None
    status: Literal["POSITIVE", "INCONCLUSIVE", "NEGATIVE"]
    sha256: str
    timestamp: str  # ISO 8601, as captured offline
    analysis: SyncAnalysisIn


class SyncBatchRequest(BaseModel):
    records: List[SyncRecordIn]


class SyncResultOut(BaseModel):
    local_id: str
    status: Literal["created", "duplicate", "error"]
    id: Optional[str] = None
    case_number: Optional[str] = None
    detail: Optional[str] = None


class SyncBatchResponse(BaseModel):
    results: List[SyncResultOut]


# ---------------------------------------------------------------------------
# id / case_number generation — REPLACE with your real generator if one
# already exists (see module docstring).
# ---------------------------------------------------------------------------

def generate_case_identifiers(db: Session) -> Tuple[str, str]:
    """Produce the next (id, case_number) pair, e.g. ("ncb-892", "#NCB-2024-0892")."""
    year = datetime.now().year
    max_id = db.query(func.max(SeizureRecord.id)).scalar()
    next_n = 1
    if max_id:
        try:
            next_n = int(str(max_id).rsplit("-", 1)[-1]) + 1
        except ValueError:
            next_n = (db.query(func.count(SeizureRecord.id)).scalar() or 0) + 1

    return f"ncb-{next_n}", f"#NCB-{year}-{next_n:04d}"


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/batch", response_model=SyncBatchResponse)
def sync_batch(
    payload: SyncBatchRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer),
) -> SyncBatchResponse:
    """
    Accepts a batch of offline records, persists any that aren't already
    on the server, and reports per-record status so the mobile app knows
    exactly which local rows to delete.

    Each record is processed (and committed) independently, so one bad
    record in a batch can't sink the rest.
    """
    results: List[SyncResultOut] = []

    for item in payload.records:
        try:
            # Idempotency: if the phone retries a batch because the network
            # dropped right after the server wrote the row but before the
            # 200 got back, we must not create a duplicate. sha256 is a
            # per-capture hash, so it doubles as the natural de-dupe key.
            existing = (
                db.query(SeizureRecord)
                .filter(SeizureRecord.sha256 == item.sha256)
                .first()
            )
            if existing:
                results.append(
                    SyncResultOut(
                        local_id=item.local_id,
                        status="duplicate",
                        id=existing.id,
                        case_number=existing.case_number,
                    )
                )
                continue

            new_id, case_number = generate_case_identifiers(db)

            record = SeizureRecord(
                id=new_id,
                case_number=case_number,
                officer_id=officer.id,
                officer_name=item.officer_name,
                officer_badge_number=item.officer_badge_number,
                reagent_name=item.reagent_name,
                location=item.location,
                live_location=item.live_location,
                image_name=item.image_name,
                status=item.status,
                compound_name=item.compound_name,
                sha256=item.sha256,
                timestamp_utc=datetime.fromisoformat(item.timestamp),
                synced_at=datetime.now(),
            )
            db.add(record)
            db.flush()  # ensure record.id is available for the FK below

            # reagent_id from the mobile is a client-side string (e.g. "marquis-1").
            # Only set the FK if that reagent actually exists in our table;
            # otherwise leave it NULL rather than crashing the whole batch.
            from app.models.reagent import Reagent  # local import to avoid circular
            reagent_exists = (
                db.query(Reagent.id)
                .filter(Reagent.id == item.analysis.reagent_id)
                .first()
            )

            analysis = AnalysisResult(
                record_id=record.id,
                reagent_id=item.analysis.reagent_id if reagent_exists else None,
                spectral_match=item.analysis.spectral_match,
                purity_index=item.analysis.purity_index,
                confidence=item.analysis.confidence,
                raw_delta_e=item.analysis.raw_delta_e,
            )
            db.add(analysis)
            db.commit()

            results.append(
                SyncResultOut(
                    local_id=item.local_id,
                    status="created",
                    id=record.id,
                    case_number=record.case_number,
                )
            )

        except Exception as exc:  # noqa: BLE001 - isolate failures per-record
            db.rollback()
            results.append(
                SyncResultOut(local_id=item.local_id, status="error", detail=str(exc))
            )

    return SyncBatchResponse(results=results)
