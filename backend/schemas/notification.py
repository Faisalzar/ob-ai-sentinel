"""
Notification Pydantic Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, UUID4, Field
from datetime import datetime

class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    related_upload_id: Optional[UUID4] = None

class NotificationCreate(NotificationBase):
    user_id: UUID4

class NotificationResponse(NotificationBase):
    id: UUID4
    user_id: UUID4
    sender_id: UUID4
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool
