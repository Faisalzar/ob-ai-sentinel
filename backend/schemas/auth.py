"""
Authentication request/response schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
import re


class UserRegister(BaseModel):
    """User registration request

    Relaxed email validation to allow internal domains like .local; only checks basic @ presence.
    """
    name: str = Field(..., min_length=2, max_length=255)
    email: str
    password: str = Field(..., min_length=8)
    
    @validator('email')
    def validate_email(cls, v: str) -> str:
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Invalid email format')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserLogin(BaseModel):
    """User login request"""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    requires_mfa: bool = False
    mfa_token: Optional[str] = None
    user: Optional[dict] = None  # User data for frontend
    mfa_required: bool = False  # Alias for requires_mfa


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class MFAEnableResponse(BaseModel):
    """MFA enable response"""
    secret: str
    qr_code_uri: str
    backup_codes: list[str]


class MFAVerifyRequest(BaseModel):
    """MFA verification request"""
    token: str
    mfa_token: Optional[str] = None  # Temporary token from login


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: str


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v


class MFARecoveryInitiateRequest(BaseModel):
    """MFA recovery initiation request"""
    mfa_token: str


class MFARecoveryVerifyRequest(BaseModel):
    """MFA recovery verification request"""
    mfa_token: str
    otp: str


class PasswordResetVerifyRequest(BaseModel):
    """Password reset OTP verification request"""
    email: str
    otp: str


class ResendOTPRequest(BaseModel):
    """Resend OTP request"""
    email: str
    type: str = Field(..., description="Type of OTP: 'login', 'forgot_password', 'mfa_recovery'")

