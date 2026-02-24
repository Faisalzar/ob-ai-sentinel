"""
Notification API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend.db.base import get_db
from backend.models.models import User, Notification
from backend.schemas.notification import NotificationResponse, NotificationCreate, NotificationUpdate
from backend.core.dependencies import get_current_user, get_current_admin_user
from backend.services.security_service import log_admin_action

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get notifications for the current user
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a specific notification as read or unread
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    notification.is_read = update_data.is_read
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all unread notifications as read
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"message": "All notifications marked as read"}

# --- ADMIN ROUTES FOR NOTIFICATIONS ---

admin_router = APIRouter(prefix="/admin/notifications", tags=["Admin Notifications"])

@admin_router.post("", response_model=NotificationResponse)
async def send_admin_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Send a notification to a specific user about an upload/alert
    """
    # Verify recipient exists
    target_user = db.query(User).filter(User.id == notification_data.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    new_notification = Notification(
        user_id=notification_data.user_id,
        sender_id=current_user.id,
        title=notification_data.title,
        message=notification_data.message,
        related_upload_id=notification_data.related_upload_id
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    # Log the action
    log_admin_action(
        db,
        current_user.id,
        "send_notification",
        f"Sent notification to {target_user.email}: {notification_data.title}",
        meta={"notification_id": str(new_notification.id)}
    )
    
    return new_notification
