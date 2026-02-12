"""
FastAPI dependencies
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import re

from backend.db.base import get_db
from backend.models.models import User, UserRole, SystemSettings
from backend.core.security import decode_token


security = HTTPBearer()
strict_bearer = HTTPBearer(auto_error=False)


async def _get_current_user_base(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
    allowed_types: list = ["access"]
) -> User:
    """Helper to validate different token types"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    if payload.get("type") not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type for this operation. Expected {allowed_types}"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Check Maintenance Mode
    if user.role != UserRole.ADMIN:
        settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if settings and settings.maintenance_mode:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="System is currently under maintenance. Please try again later."
            )
    
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Standard access: strictly requires 'access' token type"""
    return await _get_current_user_base(credentials, db, allowed_types=["access"])


async def get_mfa_setup_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Security flow: allows both 'access' and 'mfa_pending' (for forced setup)"""
    return await _get_current_user_base(credentials, db, allowed_types=["access", "mfa_pending"])


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current admin user"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# Strict variant: ensures exact JWT structure and clear 401s on any mismatch
async def get_current_active_user_strict(
    credentials: HTTPAuthorizationCredentials = Depends(strict_bearer),
    db: Session = Depends(get_db)
) -> User:
    if credentials is None or not credentials.scheme or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = (credentials.credentials or "").strip()

    # Exact JWT format: header.payload.signature (base64url chars only)
    if not re.fullmatch(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return user
