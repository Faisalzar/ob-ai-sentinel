"""
SQLAlchemy Database Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, JSON, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    """User role enumeration"""
    USER = "USER"
    ADMIN = "ADMIN"


class FileType(str, enum.Enum):
    """File type enumeration"""
    IMAGE = "image"
    VIDEO = "video"
    LIVE = "live"


class ThreatLevel(str, enum.Enum):
    """Threat level enumeration"""
    HARMLESS = "harmless"
    CAUTION = "caution"
    DANGEROUS = "dangerous"


class MFAState(str, enum.Enum):
    """MFA state enumeration"""
    DISABLED = "DISABLED"
    SETUP_IN_PROGRESS = "SETUP_IN_PROGRESS"
    ENABLED = "ENABLED"


class AlertStatus(str, enum.Enum):
    """Alert status enumeration"""
    NEW = "new"
    REVIEWED = "reviewed"
    ACKNOWLEDGED = "acknowledged"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    
    # MFA
    mfa_enabled = Column(Boolean, default=False, nullable=False)  # Deprecated: use mfa_state instead
    mfa_state = Column(SQLEnum(MFAState), default=MFAState.DISABLED, nullable=False)
    mfa_secret_encrypted = Column(Text, nullable=True)  # Only set when MFA is ENABLED
    mfa_secret_temporary = Column(Text, nullable=True)  # Temporary secret during setup
    backup_codes_encrypted = Column(Text, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    
    # Security
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_otp = Column(String(6), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Email OTP
    email_otp_code = Column(String(6), nullable=True)
    email_otp_expires = Column(DateTime, nullable=True)
    
    # MFA Recovery
    mfa_recovery_otp = Column(String(6), nullable=True)
    mfa_recovery_expires = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Upload(Base):
    """Upload model"""
    __tablename__ = "uploads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    file_type = Column(SQLEnum(FileType), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    
    # Detection results
    detection_summary = Column(JSON, nullable=True)  # Summary of all detections
    annotated_path = Column(Text, nullable=True)  # Path to annotated result
    
    # Status
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="uploads")
    detections = relationship("Detection", back_populates="upload", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="upload", cascade="all, delete-orphan")


class Detection(Base):
    """Detection model - individual detected objects"""
    __tablename__ = "detections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=False, index=True)
    
    class_name = Column(String(100), nullable=False, index=True)
    confidence = Column(String(10), nullable=False)  # Store as string for precision
    bbox = Column(JSON, nullable=False)  # {"x1": float, "y1": float, "x2": float, "y2": float}
    threat_level = Column(SQLEnum(ThreatLevel), nullable=False, index=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    upload = relationship("Upload", back_populates="detections")


class Alert(Base):
    """Alert model - dangerous detections only"""
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    object_name = Column(String(100), nullable=False)
    threat_level = Column(SQLEnum(ThreatLevel), nullable=False)
    confidence = Column(String(10), nullable=False)
    bbox = Column(JSON, nullable=True)
    
    image_path = Column(Text, nullable=True)
    logged_to_file = Column(Boolean, default=False, nullable=False)
    
    # Status
    status = Column(SQLEnum(AlertStatus, values_callable=lambda x: [e.value for e in x]), default=AlertStatus.NEW, nullable=False)
    admin_notes = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    upload = relationship("Upload", back_populates="alerts")


class AuditLog(Base):
    """Audit log model - track all user/admin actions"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    action = Column(String(100), nullable=False, index=True)  # login, logout, upload, delete, etc.
    resource = Column(String(100), nullable=True)  # What was acted upon
    meta = Column(JSON, nullable=True)  # Additional metadata
    
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    
    status = Column(String(20), nullable=False)  # success, failed, error
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")


class Session(Base):
    """Session model for refresh tokens"""
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    refresh_token = Column(String(512), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    is_valid = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)





class SystemSettings(Base):
    """System-wide dynamic settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True)  # Singleton: always ID 1
    
    # Detection
    primary_engine = Column(String(50), default="roboflow")
    fallback_engine = Column(String(50), default="yolov8")
    detection_timeout = Column(Integer, default=30)  # seconds
    min_confidence = Column(Integer, default=40)  # percent
    
    # Uploads
    max_image_size_mb = Column(Integer, default=5)
    max_video_size_mb = Column(Integer, default=50)
    allowed_file_types = Column(JSON, default=["image/jpeg", "image/png", "video/mp4"])
    
    # Security
    otp_expiry_minutes = Column(Integer, default=10)
    max_login_attempts = Column(Integer, default=5)
    mfa_enforced_for_admins = Column(Boolean, default=False)
    
    # Maintenance
    maintenance_mode = Column(Boolean, default=False)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)



