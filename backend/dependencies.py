"""
Centralized auth dependencies for route protection.

- get_current_user: Mandatory auth — raises 401 if token is missing/invalid.
- get_optional_user: Optional auth — returns None for unauthenticated requests.
- require_role(*roles): Factory that produces a dependency checking role membership.
- require_admin / require_staff: Convenient shorthands.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import JWTError, jwt
from typing import Optional

from database import get_db
import models

import os

# Must match the values in routers/auth.py
SECRET_KEY = os.getenv("SECRET_KEY", "rasoi360_access_secret_key_v2")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=True)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> models.User:
    """Decode the access token, fetch the user, raise 401 on any failure."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("user_id")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(models.User)
        .where(models.User.id == user_id)
        .options(selectinload(models.User.role), selectinload(models.User.restaurant))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def get_current_restaurant(
    current_user: models.User = Depends(get_current_user),
) -> models.Restaurant:
    """Ensures the user belongs to a restaurant and the restaurant is active/trialing."""
    if not current_user.restaurant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any restaurant",
        )
    
    # Check subscription status
    if current_user.restaurant.subscription_status == "expired":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant subscription or trial has expired",
        )
        
    return current_user.restaurant


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> Optional[models.User]:
    """Same as get_current_user but returns None instead of raising 401.
    Used for routes accessible by both authenticated staff and unauthenticated customers."""
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("user_id")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            return None
    except JWTError:
        return None

    result = await db.execute(
        select(models.User)
        .where(models.User.id == user_id)
        .options(selectinload(models.User.role))
    )
    return result.scalar_one_or_none()


def require_role(*allowed_roles: str):
    """Factory: returns a dependency that checks the user's role against allowed_roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint(...): ...

    Or as a parameter dependency:
        async def endpoint(user: models.User = Depends(require_role("admin", "waiter"))): ...
    """
    async def _role_checker(
        current_user: models.User = Depends(get_current_user),
    ) -> models.User:
        role_name = current_user.role.name.lower() if current_user.role else ""
        if role_name not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}",
            )
        return current_user
    return _role_checker


async def require_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensures the user is a platform superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Superuser privileges required.",
        )
    return current_user


# Convenient shorthands
require_admin = require_role("admin")
require_staff = require_role("admin", "waiter", "chef")
