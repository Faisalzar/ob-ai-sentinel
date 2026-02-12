"""
Core configuration management
"""
import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import yaml


class Settings(BaseSettings):
    """Application settings loaded from environment and config file"""
    
    # App settings
    APP_NAME: str = "AI Object Detection Backend"
    APP_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    FRONTEND_URL: str = "http://localhost:3000"  # Frontend URL for email links
    
    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20160  # 14 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    
    # Password policy
    MIN_PASSWORD_LENGTH: int = 8
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Security Headers
    HSTS_MAX_AGE: int = 31536000  # 1 year in seconds
    CSP_POLICY: str = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://fastapi.tiangolo.com; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net"
    
    # Storage
    STORAGE_MODE: str = "local"  # local or cloud
    LOCAL_UPLOAD_PATH: str = "uploads"
    LOCAL_OUTPUT_PATH: str = "outputs"
    AWS_ACCESS_KEY: Optional[str] = None
    AWS_SECRET_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET_NAME: Optional[str] = None
    
    # AI Model (auto-detects: Roboflow first, then YOLOv8 fallback)
    MODEL_MODE: str = "auto"  # auto, yolov8, or roboflow
    MODEL_PATH: str = "ai/models/best.pt"
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45
    DEVICE: str = "cpu"
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 100
    
    # Roboflow API (optional)
    ROBOFLOW_API_KEY: Optional[str] = None
    ROBOFLOW_MODEL_ENDPOINT: Optional[str] = None  # e.g., "your-model/1"
    
    # Additional Roboflow Models
    ROBOFLOW_MODEL_ANIMAL: Optional[str] = None
    ROBOFLOW_MODEL_PERSON: Optional[str] = None
    ROBOFLOW_MODEL_THEFT: Optional[str] = None
    ROBOFLOW_MODEL_LOGISTICS: Optional[str] = None
    ROBOFLOW_MODEL_CAR: Optional[str] = None
    ROBOFLOW_MODEL_HUMAN: Optional[str] = None
    ROBOFLOW_MODEL_GUNS: Optional[str] = None
    ROBOFLOW_MODEL_GUNS_DATASET: Optional[str] = None
    ROBOFLOW_MODEL_ANIMALS_ALT: Optional[str] = None
    ROBOFLOW_MODEL_PREMADE: Optional[str] = None
    
    # Alternative Roboflow API
    ROBOFLOW_API_KEY_ALT: Optional[str] = None
    ROBOFLOW_API_URL_ALT: Optional[str] = None
    ROBOFLOW_MODEL_GUN_ALT: Optional[str] = None
    
    # Email
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    FROM_Email: str
    FROM_NAME: str = "Ob AI Sentinel"
    
    # Brevo Email API (HTTP) - Bypass Blocking
    BREVO_API_KEY: Optional[str] = None
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # MFA
    MFA_ISSUER_NAME: str = "AI Object Detection"
    OTP_VALID_WINDOW: int = 2
    
    # Logging
    LOG_LEVEL: str = "INFO"
    ALERT_LOG_PATH: str = "outputs/alerts/alerts.log"
    AUDIT_LOG_PATH: str = "outputs/audit.log"
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 5
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


def load_config() -> Settings:
    """Load configuration from environment and YAML file"""
    # Load YAML config if exists
    config_path = Path("configs/config.yaml")
    if config_path.exists():
        with open(config_path) as f:
            yaml_config = yaml.safe_load(f)
        
        # Expand environment variables in YAML
        # This is handled by BaseSettings automatically
    
    return Settings()


# Global settings instance
settings = load_config()


# Dangerous classes for threat detection
DANGEROUS_CLASSES = [
    "gun", "pistol", "rifle", "knife", "grenade", 
    "explosive", "bomb", "weapon", "firearm", "ied",
    "improvised explosive device", "explosives"
]

CAUTION_CLASSES = [
    "person", "suspicious_object"
]


def get_threat_level(class_name: str) -> str:
    """Determine threat level based on detected class"""
    class_lower = class_name.lower()
    
    if any(danger in class_lower for danger in DANGEROUS_CLASSES):
        return "dangerous"
    elif any(caution in class_lower for caution in CAUTION_CLASSES):
        return "caution"
    else:
        return "harmless"
