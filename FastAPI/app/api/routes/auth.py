from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.models.officer import Officer
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    badge_number = payload.badge_number.strip().upper()
    officer = db.query(Officer).filter(Officer.badge_number == badge_number).first()

    if officer is None or not verify_password(payload.passcode, officer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid badge number or passcode",
        )

    access_token = create_access_token(
        data={"sub": officer.badge_number},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        officer_id=officer.id,
        badge_number=officer.badge_number,
        name=officer.name,
    )

