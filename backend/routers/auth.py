"""
Auth router — login, refresh, logout, me.

Access tokens: 30 min, signed with ACCESS secret.
Refresh tokens: 7 days, signed with REFRESH secret, blacklisted on logout via Redis.
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import JWTError, jwt
import bcrypt

from database import get_db
from dependencies import get_current_user
from redis_client import redis_client
import models, schemas

import os

# ── Secrets & Config ──────────────────────────────────────────────────
ACCESS_SECRET_KEY = os.getenv("SECRET_KEY", "rasoi360_access_secret_key_v2")
REFRESH_SECRET_KEY = os.getenv("REFRESH_TOKEN_SECRET", "rasoi360_refresh_secret_key_v2")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

from sqlalchemy import select
import crud

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    restaurant_name: str
    admin_full_name: str
    email: str
    phone_number: str
    password: str

@router.post("/register")
async def register_restaurant(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Automated Onboarding: Create restaurant, admin user, and default setup."""
    # 1. Check if email exists
    stmt = select(models.User).where(models.User.email == body.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 2. Create Restaurant (14-day trial)
    slug = body.restaurant_name.lower().replace(" ", "-")[:50]
    # Simple duplicate slug check
    slug_check = await db.execute(select(models.Restaurant).where(models.Restaurant.slug == slug))
    if slug_check.scalar_one_or_none():
        slug = f"{slug}-{str(datetime.now().timestamp())[-4:]}"

    new_restaurant = models.Restaurant(
        name=body.restaurant_name,
        slug=slug,
        subscription_status="trial",
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14)
    )
    db.add(new_restaurant)
    await db.flush()

    # 3. Create Admin Role & User
    role_res = await db.execute(select(models.Role).where(models.Role.name == "admin"))
    admin_role = role_res.scalar_one()

    new_user = models.User(
        restaurant_id=new_restaurant.id,
        full_name=body.admin_full_name,
        email=body.email,
        phone_number=body.phone_number,
        password_hash=get_password_hash(body.password),
        role_id=admin_role.id
    )
    db.add(new_user)
    
    # 4. Bootstrap Default Setup
    # Create one default Kitchen Station
    default_station = models.KitchenStation(name="Main Kitchen", restaurant_id=new_restaurant.id)
    db.add(default_station)
    
    # Create 5 default Tables
    for i in range(1, 6):
        db.add(models.RestaurantTable(table_number=f"T{i}", restaurant_id=new_restaurant.id))

    await db.commit()
    return {"message": "Restaurant registered successfully", "slug": slug}
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(user_id: int, role: str, is_superuser: bool = False) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "user_id": user_id,
        "role": role,
        "is_superuser": is_superuser,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, ACCESS_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "user_id": user_id,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.TokenResponse)
async def login(body: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email or phone + password.
    Returns access_token, refresh_token, and user info."""

    identifier = body.identifier.strip()

    # Try email first, then phone
    stmt = (
        select(models.User)
        .options(selectinload(models.User.role))
        .where(
            (models.User.email == identifier) | (models.User.phone_number == identifier)
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    role_name = user.role.name if user.role else "unknown"

    access_token = create_access_token(user.id, role_name, user.is_superuser)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "role": role_name,
            "is_superuser": user.is_superuser,
            "restaurant_id": user.restaurant_id,
            "restaurant_slug": user.restaurant.slug if user.restaurant else None,
        },
    }


@router.post("/refresh")
async def refresh_token(body: schemas.RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid, non-blacklisted refresh token for a new access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = jwt.decode(body.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("user_id")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Check Redis blacklist
    blacklisted = await redis_client.get(f"blacklist:{body.refresh_token}")
    if blacklisted:
        raise credentials_exception

    # Fetch user to get current role
    result = await db.execute(
        select(models.User)
        .where(models.User.id == user_id)
        .options(selectinload(models.User.role))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    role_name = user.role.name if user.role else "unknown"
    new_access_token = create_access_token(user.id, role_name)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(body: schemas.RefreshRequest):
    """Blacklist the refresh token so it cannot be reused."""
    try:
        payload = jwt.decode(body.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp", 0)
        # TTL = remaining seconds until the token would have expired naturally
        remaining = max(int(exp - datetime.now(timezone.utc).timestamp()), 1)
        await redis_client.setex(f"blacklist:{body.refresh_token}", remaining, "1")
    except JWTError:
        pass  # Even if token is malformed, logout should succeed silently

    return {"detail": "Logged out successfully"}


@router.get("/me", response_model=schemas.UserOut)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "role": current_user.role.name if current_user.role else "unknown",
    }
