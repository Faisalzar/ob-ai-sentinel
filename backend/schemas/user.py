"""
User and detection schemas
"""
from pydantic import BaseModel, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserResponse(BaseModel):
    """User response"""
    id: UUID4
    name: str
    email: str
    role: str
    mfa_enabled: bool
    is_active: bool
    is_online: bool = False
    mfa_state: str = "DISABLED"
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserChangePassword(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = None
    email: Optional[str] = None


class DetectionBox(BaseModel):
    """Bounding box for detection"""
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    """Single detection result"""
    class_name: str
    confidence: str
    bbox: DetectionBox
    threat_level: str


class DetectionSummary(BaseModel):
    """Detection summary statistics"""
    total_detections: int
    dangerous_count: int
    caution_count: int
    harmless_count: int
    classes_detected: List[str]
    has_dangerous_objects: bool
    dangerous_objects: List[str] = []


class UploadResponse(BaseModel):
    """Upload response"""
    id: UUID4
    filename: str
    file_type: str
    file_path: str
    annotated_path: Optional[str]
    detection_summary: Optional[Dict[str, Any]]
    is_processed: bool
    created_at: datetime
    processed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    """User statistics"""
    total_uploads: int
    total_detections: int
    dangerous_detections: int
    image_count: int
    video_count: int
    live_count: int
    dangerous_alerts: int
    active_cameras: int
    latency_ms: int
    recent_uploads: List[UploadResponse]


class DetectionResponse(BaseModel):
    """Detection API response"""
    upload_id: UUID4
    filename: str
    detections: List[DetectionResult]
    summary: DetectionSummary
    annotated_url: str
    warnings: List[str] = []


class SystemSettingsPublic(BaseModel):
    """Public system settings for general users"""
    max_image_size_mb: int
    max_video_size_mb: int
    primary_engine: str
    min_confidence: int
    allowed_file_types: List[str]
    maintenance_mode: bool

    class Config:
        from_attributes = True
