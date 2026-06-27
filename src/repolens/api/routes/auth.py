"""Auth routes — register, login, current-user."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from repolens.api.deps import get_current_user
from repolens.db.models import User
from repolens.db.session import get_db
from repolens.services.auth import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    username: str = Field(..., min_length=2, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=1, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str

    @classmethod
    def from_user(cls, user: User) -> "UserResponse":
        return cls(id=str(user.id), email=user.email, username=user.username)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """Create a new user account and return a JWT."""
    try:
        user, token = await register_user(
            db, email=payload.email, username=payload.username, password=payload.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return AuthResponse(token=token, user=UserResponse.from_user(user))


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """Authenticate with email + password and return a JWT."""
    try:
        user, token = await authenticate_user(
            db, email=payload.email, password=payload.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return AuthResponse(token=token, user=UserResponse.from_user(user))


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Return the currently authenticated user."""
    return UserResponse.from_user(current_user)
