from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from backend.models.models import UserRole, AlertStatus

# User Creation
class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: Optional[str] = Field(None, min_length=8)
    role: UserRole = UserRole.USER
    is_active: bool = True

# Settings
class SystemSettingsBase(BaseModel):
    primary_engine: str = "roboflow"
    fallback_engine: str = "yolov8"
    detection_timeout: int = 30
    min_confidence: int = 40
    max_image_size_mb: int = 5
    max_video_size_mb: int = 50
    otp_expiry_minutes: int = 10
    max_login_attempts: int = 5
    mfa_enforced_for_admins: bool = False
    maintenance_mode: bool = False

class SystemSettingsUpdate(SystemSettingsBase):
    pass

class SystemSettingsResponse(SystemSettingsBase):
    id: int
    updated_at: Optional[datetime]
    updated_by: Optional[str] = None # User UUID as string
    
    class Config:
        from_attributes = True

# Alert Update
class AlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    admin_notes: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    upload_id: str
    filename: str
    object_name: str
    threat_level: str
    confidence: str
    timestamp: datetime
    image_path: Optional[str]
    status: AlertStatus
    admin_notes: Optional[str]

    class Config:
        from_attributes = True
