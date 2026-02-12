"""
Security utilities: Argon2id hashing, AES-256-GCM encryption, JWT tokens
"""
import base64
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt
import pyotp

from backend.core.config import settings


# Argon2id password hasher (secure parameters)
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id"""
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against Argon2id hash"""
    try:
        ph.verify(hashed, password)
        # Check if rehashing is needed (Argon2 recommendation)
        if ph.check_needs_rehash(hashed):
            return True  # Signal to rehash in application logic
        return True
    except VerifyMismatchError:
        return False


def needs_rehash(hashed: str) -> bool:
    """Check if password hash needs updating"""
    return ph.check_needs_rehash(hashed)


# AES-256-GCM Encryption
def get_encryption_key() -> bytes:
    """Get encryption key from settings"""
    key_str = settings.ENCRYPTION_KEY
    # Ensure it's 32 bytes for AES-256
    if len(key_str) == 44:  # Base64 encoded 32 bytes
        return base64.b64decode(key_str)
    elif len(key_str) == 32:
        return key_str.encode()
    else:
        raise ValueError("ENCRYPTION_KEY must be 32 bytes (base64 encoded 44 chars)")


def encrypt_data(plaintext: str) -> str:
    """Encrypt data using AES-256-GCM"""
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)  # 96-bit nonce for GCM
    
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    
    # Combine nonce + ciphertext and encode
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode()


def decrypt_data(encrypted: str) -> str:
    """Decrypt data using AES-256-GCM"""
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    
    combined = base64.b64decode(encrypted)
    nonce = combined[:12]
    ciphertext = combined[12:]
    
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()


# JWT Token Management
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    if "type" not in to_encode:
        to_encode["type"] = "access"
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire, 
        "type": "refresh",
        "jti": str(uuid.uuid4())  # Unique identifier to prevent collisions
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# MFA (Multi-Factor Authentication)
def generate_totp_secret() -> str:
    """Generate TOTP secret for MFA"""
    return pyotp.random_base32()


def get_totp_uri(secret: str, user_email: str) -> str:
    """Generate TOTP provisioning URI for QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user_email,
        issuer_name=settings.MFA_ISSUER_NAME
    )


def verify_totp(secret: str, token: str) -> bool:
    """Verify TOTP token"""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=settings.OTP_VALID_WINDOW)


def generate_backup_codes(count: int = 10) -> list[str]:
    """Generate backup codes for MFA"""
    return [secrets.token_hex(4) for _ in range(count)]


# Email OTP (fallback MFA)
def generate_email_otp() -> str:
    """Generate 6-digit OTP for email"""
    return f"{secrets.randbelow(1000000):06d}"


# Security token generation
def generate_verification_token() -> str:
    """Generate secure verification token"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate password reset token"""
    return secrets.token_urlsafe(32)
