from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_officer, get_db
from app.models.officer import Officer
from app.schemas.officer import OfficerOut, OfficerUpdate

router = APIRouter(prefix="/officers", tags=["officers"])


@router.get("/me", response_model=OfficerOut)
def read_me(current_officer: Officer = Depends(get_current_officer)) -> Officer:
    return current_officer


@router.post("/me", response_model=OfficerOut)
def update_me(
    payload: OfficerUpdate,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> Officer:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return current_officer

    for field, value in updates.items():
        setattr(current_officer, field, value)

    db.add(current_officer)
    db.commit()
    db.refresh(current_officer)
    return current_officer


@router.get("/{badge_number}", response_model=OfficerOut)
def get_by_badge(
    badge_number: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> Officer:
    badge = badge_number.strip().upper()
    officer = db.query(Officer).filter(Officer.badge_number == badge).first()

    if officer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Officer not found")

    return officer

