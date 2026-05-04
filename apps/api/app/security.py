"""Password hashing + JWT helpers."""
import secrets
import string
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def create_access_token(*, user_id: str, email: str, role: str = "CLIENT", impersonator_id: str | None = None) -> str:
    """Standard JWT.

    `impersonator_id` is non-None only when an admin is impersonating a client.
    The frontend can still operate as the client; downstream we have an audit trail.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    payload: dict = {"sub": user_id, "email": email, "role": role, "exp": expire}
    if impersonator_id:
        payload["impersonator"] = impersonator_id
        # Shorter-lived impersonation tokens (1 hour)
        payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid token") from e


def generate_temp_password(length: int = 12) -> str:
    """Human-friendly temp password: 12 chars, mixed alphanumerics, no confusing chars (0/O/1/l)."""
    alphabet = "".join(c for c in string.ascii_letters + string.digits if c not in "0O1lI")
    return "".join(secrets.choice(alphabet) for _ in range(length))
