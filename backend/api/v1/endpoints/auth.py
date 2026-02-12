"""
Authentication API endpoints
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

from backend.db.base import get_db
from backend.models.models import User, Session as SessionModel, UserRole, AuditLog, MFAState, SystemSettings
from backend.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, RefreshTokenRequest,
    MFAEnableResponse, MFAVerifyRequest, PasswordResetRequest, PasswordResetConfirm,
    MFARecoveryInitiateRequest, MFARecoveryVerifyRequest, PasswordResetVerifyRequest, ResendOTPRequest
)
from backend.schemas.user import UserResponse, UserUpdate
from backend.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_token, generate_totp_secret, get_totp_uri, verify_totp,
    generate_backup_codes, encrypt_data, decrypt_data, generate_reset_token,
    generate_email_otp
)
from backend.core.config import settings
from backend.core.dependencies import get_current_user, get_mfa_setup_user
from backend.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_audit_log(db: Session, user_id: uuid.UUID, action: str, status: str, meta: dict = None):
    """Helper to create audit log"""
    log = AuditLog(
        user_id=user_id,
        action=action,
        status=status,
        meta=meta or {}
    )
    db.add(log)
    db.commit()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check system settings for Maintenance Mode
    system_settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if system_settings and system_settings.maintenance_mode:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is currently under maintenance. Registration is temporarily disabled."
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=UserRole.USER,
        is_verified=True  # Set to False if email verification is needed
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create audit log
    create_audit_log(db, new_user.id, "register", "success")
    
    # Send welcome email (async, don't wait)
    try:
        await email_service.send_welcome_email(new_user.email, new_user.name)
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
    
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    Returns tokens or requires MFA if enabled
    """
    # Find user
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked until {user.locked_until}"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts += 1
        
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to too many failed attempts"
            )
        
        db.commit()
        create_audit_log(db, user.id, "login", "failed", {"reason": "invalid_password"})
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # Check system settings for Maintenance Mode and Admin MFA
    system_settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    
    # Enforce Maintenance Mode: only allow admins during maintenance
    if system_settings and system_settings.maintenance_mode and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is currently under maintenance. Only administrators can log in at this time."
        )
    
    mfa_enforced_for_admin = False
    if system_settings and system_settings.mfa_enforced_for_admins and user.role == UserRole.ADMIN:
        mfa_enforced_for_admin = True
    
    # Check MFA state - require if enabled OR if enforced for admins
    if user.mfa_state == MFAState.ENABLED or mfa_enforced_for_admin:
        # MFA is required
        mfa_token_data = {"sub": str(user.id), "type": "mfa_pending"}
        mfa_token = create_access_token(mfa_token_data, timedelta(minutes=15))
        
        return TokenResponse(
            access_token="",
            refresh_token="",
            token_type="bearer",
            expires_in=0,
            requires_mfa=True,
            mfa_token=mfa_token,
            user={
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "is_admin": user.role == UserRole.ADMIN,
                "mfa_enabled": user.mfa_state == MFAState.ENABLED
            },
            mfa_required=True
        )
    
    # For regular users or admins without enforced MFA where state is DISABLED/SETUP_IN_PROGRESS, continue with normal login
    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Save session
    session = SessionModel(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    create_audit_log(db, user.id, "login", "success")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "is_admin": user.role == UserRole.ADMIN,
            "mfa_enabled": user.mfa_state == MFAState.ENABLED
        },
        mfa_required=False
    )


@router.post("/verify-mfa", response_model=TokenResponse)
async def verify_mfa(
    mfa_data: MFAVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify MFA token and complete login
    """
    try:
        if not mfa_data.mfa_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA token required"
            )
        
        # Verify MFA pending token
        payload = decode_token(mfa_data.mfa_token)
        if not payload or payload.get("type") != "mfa_pending":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA token"
            )
        
        # Check maintenance mode
        system_settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
        if system_settings and system_settings.maintenance_mode:
            user = db.query(User).filter(User.id == payload.get("sub")).first()
            if user and user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="System is currently under maintenance. Only administrators can log in."
                )
        
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Decrypt and verify TOTP
        if not user.mfa_secret_encrypted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA not enabled"
            )
        
        secret = decrypt_data(user.mfa_secret_encrypted)
        
        if not verify_totp(secret, mfa_data.token):
            create_audit_log(db, user.id, "mfa_verify", "failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code"
            )
        
        # Create tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        # Save session
        session = SessionModel(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(session)
        
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        create_audit_log(db, user.id, "mfa_verify", "success")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback() # Rollback invalid transaction before doing anything else
        logger.error(f"MFA verification failed: {str(e)}")
        
        # Try to log error, but don't crash if it fails
        try:
            if 'user' in locals() and user:
                create_audit_log(db, user.id, "mfa_verify", "error", {"error": str(e)})
        except Exception:
            pass
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Verification failed: {str(e)}. Please try logging in again."
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    payload = decode_token(token_data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if session exists and is valid
    session = db.query(SessionModel).filter(
        SessionModel.refresh_token == token_data.refresh_token,
        SessionModel.is_valid == True
    ).first()
    
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid"
        )
    
    # Create new access token
    user_id = payload.get("sub")
    access_token = create_access_token({"sub": user_id})
    
    # Update session last used
    session.last_used_at = datetime.utcnow()
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=token_data.refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/enable-mfa", response_model=MFAEnableResponse)
async def enable_mfa(
    current_user: User = Depends(get_mfa_setup_user),
    db: Session = Depends(get_db)
):
    """
    Enable MFA for user account - Phase 1: Setup In Progress
    Returns QR code URI and backup codes for user to scan
    MFA is NOT enforced until user verifies with confirm-mfa endpoint
    """
    if current_user.mfa_state == MFAState.ENABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA already enabled"
        )
    
    # Generate TOTP secret
    secret = generate_totp_secret()
    qr_uri = get_totp_uri(secret, current_user.email)
    
    # Generate backup codes
    backup_codes = generate_backup_codes()
    
    # Store temporarily - MFA NOT enforced yet
    current_user.mfa_secret_temporary = encrypt_data(secret)
    current_user.backup_codes_encrypted = encrypt_data(",".join(backup_codes))
    current_user.mfa_state = MFAState.SETUP_IN_PROGRESS
    
    # Keep mfa_enabled as False until confirmed
    current_user.mfa_enabled = False
    
    db.commit()
    
    create_audit_log(db, current_user.id, "mfa_setup_started", "success")
    
    return MFAEnableResponse(
        secret=secret,
        qr_code_uri=qr_uri,
        backup_codes=backup_codes
    )


@router.post("/confirm-mfa")
async def confirm_mfa(
    mfa_data: MFAVerifyRequest,
    current_user: User = Depends(get_mfa_setup_user),
    db: Session = Depends(get_db)
):
    """
    Confirm MFA setup - Phase 2: Verify TOTP and enable MFA
    User must provide valid TOTP code after scanning QR code
    Only after this endpoint succeeds is MFA fully enabled
    """
    if current_user.mfa_state != MFAState.SETUP_IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup not in progress"
        )
    
    if not current_user.mfa_secret_temporary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No MFA secret found - please restart MFA setup"
        )
    
    # Decrypt temporary secret and verify TOTP
    secret = decrypt_data(current_user.mfa_secret_temporary)
    
    if not verify_totp(secret, mfa_data.token):
        create_audit_log(db, current_user.id, "mfa_setup_verify_failed", "failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA code - please try again"
        )
    
    # Verification successful - move temporary secret to permanent and enable MFA
    current_user.mfa_secret_encrypted = current_user.mfa_secret_temporary
    current_user.mfa_secret_temporary = None
    current_user.mfa_state = MFAState.ENABLED
    current_user.mfa_enabled = True  # Set legacy field for backward compatibility
    
    db.commit()
    
    create_audit_log(db, current_user.id, "mfa_enabled", "success")
    
    # Send confirmation email with backup codes
    try:
        if current_user.backup_codes_encrypted:
            backup_codes = decrypt_data(current_user.backup_codes_encrypted).split(",")
            await email_service.send_mfa_setup_email(
                current_user.email,
                current_user.name,
                backup_codes
            )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send MFA confirmation email: {e}")
    
    return {
        "message": "MFA enabled successfully",
        "mfa_enabled": True
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout - invalidate all user sessions and clear incomplete MFA setup
    """
    # Clear any MFA setup in progress
    if current_user.mfa_state == MFAState.SETUP_IN_PROGRESS:
        current_user.mfa_secret_temporary = None
        current_user.mfa_state = MFAState.DISABLED
        current_user.mfa_enabled = False
        current_user.backup_codes_encrypted = None
        create_audit_log(db, current_user.id, "mfa_setup_abandoned", "success")
    
    # Invalidate all user sessions
    db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id
    ).update({"is_valid": False})
    
    db.commit()
    
    create_audit_log(db, current_user.id, "logout", "success")
    
    return {"message": "Logged out successfully"}


@router.post("/disable-mfa")
async def disable_mfa(
    password_confirmation: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable MFA for user account
    Requires password confirmation for security
    Admin users cannot disable MFA if it's mandatory for admins
    """
    if current_user.mfa_state == MFAState.DISABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    # Verify password
    password = password_confirmation.get("password")
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password confirmation required"
        )
    
    if not verify_password(password, current_user.password_hash):
        create_audit_log(db, current_user.id, "disable_mfa_failed", "failed", {"reason": "invalid_password"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check if admin MFA is mandatory
    system_settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if system_settings and system_settings.mfa_enforced_for_admins and current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MFA is mandatory for all system administrators. You cannot disable it while the policy is active."
        )
    
    # Disable MFA completely
    current_user.mfa_state = MFAState.DISABLED
    current_user.mfa_enabled = False
    current_user.mfa_secret_encrypted = None
    current_user.mfa_secret_temporary = None
    current_user.backup_codes_encrypted = None
    
    db.commit()
    
    create_audit_log(db, current_user.id, "disable_mfa", "success")
    
    return {
        "message": "MFA disabled successfully",
        "mfa_enabled": False
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return current_user


@router.post("/request-password-reset")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset - sends email with OTP
    """
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Always return success to prevent user enumeration
    if not user:
        # Simulate delay
        return {"message": "If an account exists with this email, you will receive a password reset OTP shortly."}
    
    # Generate 6-digit OTP
    otp_code = generate_email_otp()
    user.password_reset_otp = otp_code
    user.password_reset_expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Clear any existing reset token to prevent old links from working (if any)
    user.password_reset_token = None
    
    db.commit()
    
    # Send reset email with OTP
    try:
        await email_service.send_password_reset_otp(
            user.email,
            user.name,
            otp_code,
            expiry_minutes=10
        )
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
    
    create_audit_log(db, user.id, "password_reset_request", "success")
    
    return {"message": "If an account exists with this email, you will receive a password reset OTP shortly."}


@router.post("/verify-password-reset-otp")
async def verify_password_reset_otp(
    verify_data: PasswordResetVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify password reset OTP and return a reset token
    """
    user = db.query(User).filter(User.email == verify_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or OTP"
        )
        
    # Check OTP
    if not user.password_reset_otp or not user.password_reset_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reset request found or OTP expired"
        )
        
    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
        
    if user.password_reset_otp != verify_data.otp:
        user.failed_login_attempts += 1 # Optional: count against rate limits
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
        
    # OTP Valid - Generate reset token for the next step
    reset_token = generate_reset_token()
    user.password_reset_token = reset_token
    # Extend expiry for the actual password reset action (e.g. 15 mins to finish typing new password)
    user.password_reset_expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Clear OTP
    user.password_reset_otp = None
    
    db.commit()
    
    return {
        "message": "OTP verified",
        "reset_token": reset_token
    }


@router.post("/resend-otp")
async def resend_otp(
    request: ResendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Resend OTP for various flows
    """
    import random
    
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Return success to prevent enumeration
        return {"message": "If valid, OTP has been resent"}
        
    otp_code = generate_email_otp()
    
    if request.type == 'login':
        user.email_otp_code = otp_code
        user.email_otp_expires = datetime.utcnow() + timedelta(minutes=10)
        try:
            await email_service.send_email_otp(user.email, user.name, otp_code)
        except Exception:
            pass # Logger error inside
            
    elif request.type == 'forgot_password':
        user.password_reset_otp = otp_code
        user.password_reset_expires = datetime.utcnow() + timedelta(minutes=10)
        try:
            await email_service.send_password_reset_otp(user.email, user.name, otp_code)
        except Exception:
            pass
            
    elif request.type == 'mfa_recovery':
        user.mfa_recovery_otp = otp_code
        user.mfa_recovery_expires = datetime.utcnow() + timedelta(minutes=10)
        try:
            await email_service.send_mfa_recovery_email(user.email, user.name, otp_code)
        except Exception:
            pass
            
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP type")
        
    db.commit()
    return {"message": "If valid, OTP has been resent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token
    """
    user = db.query(User).filter(
        User.password_reset_token == reset_data.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token expired
    if not user.password_reset_expires or user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update password
    user.password_hash = hash_password(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # Invalidate all sessions
    db.query(SessionModel).filter(
        SessionModel.user_id == user.id
    ).update({"is_valid": False})
    
    db.commit()
    
    create_audit_log(db, user.id, "password_reset", "success")
    
    return {"message": "Password reset successfully"}


from pydantic import BaseModel

class EmailOTPRequest(BaseModel):
    email: str

@router.post("/send-email-otp")
async def send_email_otp(
    request: EmailOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Generate and send email OTP for verification
    
    This endpoint is called after successful login to send OTP to user's email.
    """
    import random
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Return success to prevent user enumeration
        return {"message": "OTP sent successfully"}
    
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Store OTP with expiry (10 minutes)
    user.email_otp_code = otp_code
    user.email_otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    # Print OTP to console for development
    print("\n" + "="*60)
    print(f"📧 EMAIL OTP FOR {user.email}")
    print(f"🔑 CODE: {otp_code}")
    print(f"⏰ EXPIRES: 10 minutes")
    print("="*60 + "\n")
    
    # Send email
    try:
        await email_service.send_email_otp(
            user.email,
            user.name,
            otp_code,
            expiry_minutes=10
        )
        logger.info(f"Email OTP sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send email OTP: {e}")
        # Still return success to user (OTP is printed to console)
    
    create_audit_log(db, user.id, "send_email_otp", "success")
    
    return {"message": "OTP sent successfully"}


class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

@router.post("/verify-email-otp")
async def verify_email_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Verify email OTP code
    
    Returns success if OTP is valid and not expired.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or OTP"
        )

    # Check maintenance mode
    system_settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if system_settings and system_settings.maintenance_mode and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is currently under maintenance. Only administrators can log in."
        )
    
    # Check if OTP exists and is not expired
    if not user.email_otp_code or not user.email_otp_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one."
        )
    
    if user.email_otp_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    # Verify OTP
    if user.email_otp_code != request.otp_code:
        create_audit_log(db, user.id, "verify_email_otp", "failed", {"reason": "invalid_code"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code"
        )
    
    # Clear OTP after successful verification
    user.email_otp_code = None
    user.email_otp_expires = None
    db.commit()
    
    create_audit_log(db, user.id, "verify_email_otp", "success")
    
    return {
        "message": "Email OTP verified successfully",
        "verified": True
    }


@router.post("/initiate-mfa-recovery")
async def initiate_mfa_recovery(
    request: MFARecoveryInitiateRequest,
    db: Session = Depends(get_db)
):
    """
    Step 1: Initiate MFA recovery by sending Email OTP
    User must provide the valid temp mfa_token received during login
    """
    # Verify MFA pending token
    payload = decode_token(request.mfa_token)
    if not payload or payload.get("type") != "mfa_pending":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please login again."
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Generate OTP
    otp_code = generate_email_otp()
    user.mfa_recovery_otp = otp_code
    user.mfa_recovery_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    # Send email
    try:
        await email_service.send_mfa_recovery_email(
            user.email,
            user.name,
            otp_code,
            expiry_minutes=10
        )
    except Exception as e:
        logger.error(f"Failed to send recovery email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP")
        
    create_audit_log(db, user.id, "mfa_recovery_initiated", "success")
    return {"message": "Recovery OTP sent to your email"}


@router.post("/verify-mfa-recovery", response_model=TokenResponse)
async def verify_mfa_recovery(
    request: MFARecoveryVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify OTP and disable MFA
    """
    # Verify MFA pending token
    payload = decode_token(request.mfa_token)
    if not payload or payload.get("type") != "mfa_pending":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check OTP
    if not user.mfa_recovery_otp or not user.mfa_recovery_expires:
        raise HTTPException(status_code=400, detail="No recovery request found")
        
    if user.mfa_recovery_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if user.mfa_recovery_otp != request.otp:
        create_audit_log(db, user.id, "mfa_recovery_failed", "failed")
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    # Success: Disable MFA
    user.mfa_state = MFAState.DISABLED
    user.mfa_enabled = False
    user.mfa_secret_encrypted = None
    user.mfa_recovery_otp = None
    user.mfa_recovery_expires = None
    
    # Create tokens (Log user in)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    session = SessionModel(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    create_audit_log(db, user.id, "mfa_recovery_success", "success", {"action": "mfa_disabled"})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "is_admin": user.role == UserRole.ADMIN,
            "mfa_enabled": False
        }
    )
@router.put("/update-profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile - specific method to bypass user router issues
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_update.name:
        user.name = user_update.name
    
    db.commit()
    db.refresh(user)
    
    return user
