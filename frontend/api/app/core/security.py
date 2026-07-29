from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import secrets as _secrets

from jose import jwt, JWTError
import bcrypt as bcrypt_lib

from app.core.config import settings

# Token "type" claims — a token minted for one purpose must not be accepted
# for another (e.g. an email-verification token can't authenticate a request).
ACCESS = "access"
VERIFY = "verify_email"
RESET = "password_reset"


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# Passwords
# --------------------------------------------------------------------------- #
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_lib.checkpw(plain_password[:72].encode(), hashed_password.encode())


def get_password_hash(password: str) -> str:
    return bcrypt_lib.hashpw(password[:72].encode(), bcrypt_lib.gensalt(rounds=12)).decode()


# --------------------------------------------------------------------------- #
# Access tokens (short-lived JWT bearer)
# --------------------------------------------------------------------------- #
def create_access_token(subject: int, expires_delta: Optional[timedelta] = None) -> str:
    expire = _now() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject), "type": ACCESS}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != ACCESS:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------- #
# Refresh tokens (opaque, stored hashed in the DB for rotation + revocation)
# --------------------------------------------------------------------------- #
def generate_refresh_token() -> str:
    return _secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Deterministic hash for at-rest storage/lookup of opaque tokens."""
    return hashlib.sha256(token.encode()).hexdigest()


# --------------------------------------------------------------------------- #
# Single-use email tokens (verification / password reset), signed as JWTs
# --------------------------------------------------------------------------- #
def create_email_token(subject: int, purpose: str, extra: Optional[dict] = None) -> str:
    expire = _now() + timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS)
    to_encode = {"exp": expire, "sub": str(subject), "type": purpose}
    if extra:
        to_encode.update(extra)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_email_token(token: str, purpose: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != purpose:
        return None
    return payload


def password_fingerprint(hashed_password: str) -> str:
    """
    Short digest of the current password hash, embedded in reset tokens so a
    token stops working the moment the password changes — making reset
    single-use without extra storage.
    """
    return hashlib.sha256(hashed_password.encode()).hexdigest()[:16]
