from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.config import settings

# We call bcrypt directly instead of going through passlib's CryptContext.
# passlib is unmaintained (last released 2020) and its bcrypt handler runs a
# startup self-test (`detect_wrap_bug`) that crashes with
# "ValueError: password cannot be longer than 72 bytes" on any bcrypt
# version >= 4.1 — a well-known passlib/bcrypt incompatibility. Calling
# bcrypt directly sidesteps that broken code path entirely, so this stops
# depending on which bcrypt version happens to be installed.
#
# bcrypt has always silently truncated passwords over 72 bytes; the
# library's newer major versions turned that into a hard ValueError instead
# of truncating for you, so we truncate explicitly here.
_MAX_BCRYPT_BYTES = 72


def _prepare(plain: str) -> bytes:
    return plain.encode("utf-8")[:_MAX_BCRYPT_BYTES]


def hash_password(plain: str) -> str:
    hashed = bcrypt.hashpw(_prepare(plain), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed/legacy hash in the DB — treat as "does not match"
        # rather than raising, so a bad stored hash surfaces as 401
        # (invalid credentials) instead of a 500.
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
