"""Authentication service — password hashing, JWT tokens, user management."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from repolens.core.config import get_settings
from repolens.db.models import User

settings = get_settings()

ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: str, email: str, username: str) -> str:
    """Create a signed JWT with user claims."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "username": username,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns the payload dict or None if invalid."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Look up a user by email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    """Look up a user by primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register_user(
    db: AsyncSession, *, email: str, username: str, password: str
) -> tuple[User, str]:
    """Create a new user and return (user, access_token).

    Raises ValueError if email or username is already taken.
    """
    # Check for existing email
    existing = await get_user_by_email(db, email)
    if existing is not None:
        raise ValueError("A user with this email already exists")

    # Check for existing username
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is not None:
        raise ValueError("This username is already taken")

    user = User(
        email=email.lower().strip(),
        username=username.strip(),
        hashed_password=hash_password(password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.email, user.username)
    return user, token


async def authenticate_user(
    db: AsyncSession, *, email: str, password: str
) -> tuple[User, str]:
    """Verify credentials and return (user, access_token).

    Raises ValueError if credentials are invalid.
    """
    user = await get_user_by_email(db, email.lower().strip())
    if user is None or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")

    token = create_access_token(str(user.id), user.email, user.username)
    return user, token
