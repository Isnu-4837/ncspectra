from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.utils.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator:
    """Yield a SQLAlchemy DB session and close it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_officer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Decode JWT and return the authenticated Officer ORM object."""
    from app.models.officer import Officer  # local import to avoid circular

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    badge_number: str = payload.get("sub")
    if not badge_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )

    officer = db.query(Officer).filter(Officer.badge_number == badge_number).first()
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer not found",
        )

    return officer
