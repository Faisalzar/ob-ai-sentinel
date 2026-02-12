"""
Admin API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
import uuid
import csv
import io

from backend.db.base import get_db
from datetime import datetime
from backend.models.models import User, Upload, Alert, AuditLog, Detection, UserRole, Session as UserSession, AlertStatus, SystemSettings, MFAState
from backend.schemas.user import UserResponse, UploadResponse
from backend.schemas.admin import SystemSettingsUpdate, SystemSettingsResponse, AlertUpdate, AlertResponse, CreateUserRequest
from backend.core.dependencies import get_current_admin_user
from backend.services.ai_service import ai_service
from backend.services.security_service import log_admin_action

router = APIRouter(prefix="/admin", tags=["Admin"])


class AdminStatsResponse:
    """Admin statistics response"""
    total_users: int
    total_uploads: int
    total_detections: int
    total_alerts: int
    recent_alerts: int  # last 24 hours


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get system-wide statistics
    """
    from datetime import datetime, timedelta
    
    total_users = db.query(User).count()
    total_uploads = db.query(Upload).count()
    total_detections = db.query(Detection).count()
    total_alerts = db.query(Alert).count()
    
    # Recent alerts (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_alerts = db.query(Alert).filter(Alert.timestamp >= yesterday).count()
    
    # Active users (logged in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users = db.query(User).filter(
        User.last_login_at >= week_ago
    ).count()
    
    # Uploads by type
    uploads_by_type = db.query(
        Upload.file_type,
        func.count(Upload.id).label('count')
    ).group_by(Upload.file_type).all()
    
    # Detections by threat level
    detections_by_threat = db.query(
        Detection.threat_level,
        func.count(Detection.id).label('count')
    ).group_by(Detection.threat_level).all()
    
    return {
        "total_users": total_users,
        "total_uploads": total_uploads,
        "total_detections": total_detections,
        "total_alerts": total_alerts,
        "recent_alerts": recent_alerts,
        "active_users": active_users,
        "uploads_by_type": {str(t): c for t, c in uploads_by_type},
        "detections_by_threat": {str(t): c for t, c in detections_by_threat}
    }


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all users (paginated)
    """
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    # Get active user IDs (sessions that haven't expired)
    active_user_ids = db.query(UserSession.user_id).filter(
        UserSession.expires_at > datetime.utcnow()
    ).distinct().all()
    
    active_ids_set = {uid[0] for uid in active_user_ids}
    
    # Map to schema with is_online
    results = []
    for user in users:
        user_dict = UserResponse.from_orm(user).dict()
        user_dict["is_online"] = user.id in active_ids_set
        results.append(user_dict)
        
    return results


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get specific user details
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new user (admin only)
    """
    from backend.core.security import hash_password
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password if provided
    hashed_password = None
    if user_data.password:
        hashed_password = hash_password(user_data.password)
    else:
        # Generate a random password if not provided (user will need to reset)
        import secrets
        random_password = secrets.token_urlsafe(16)
        hashed_password = hash_password(random_password)
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        is_active=user_data.is_active,
        is_verified=True  # Admin-created users are auto-verified
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    log_admin_action(
        db,
        current_user.id,
        "create_user",
        f"Created user {new_user.email} with role {new_user.role}",
        ip_address="0.0.0.0"
    )
    
    return new_user



@router.put("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    is_active: Optional[bool] = None,
    role: Optional[UserRole] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user (activate/deactivate, change role)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-demotion
    if user.id == current_user.id and role and role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself"
        )
    
    updates = []
    if is_active is not None:
        user.is_active = is_active
        updates.append(f"active={is_active}")
    
    if role is not None:
        user.role = role
        updates.append(f"role={role}")
    
    db.commit()
    db.refresh(user)
    
    # Audit Log
    log_admin_action(
        db, 
        current_user.id, 
        "update_user", 
        f"Updated user {user.email}: {', '.join(updates)}", 
        ip_address="0.0.0.0" # Should extract from request
    )
    
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Manually delete sessions since relationship is not set up for cascade
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()
    
    # Nullify SystemSettings updated_by if it references this user
    db.query(SystemSettings).filter(SystemSettings.updated_by == user.id).update({"updated_by": None})
    
    try:
        email = user.email
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error deleting user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
    
    log_admin_action(db, current_user.id, "delete_user", f"Deleted user {email}")
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/logout")
async def force_logout(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Force logout a user by invalidating all their sessions
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete all sessions
    db.query(UserSession).filter(UserSession.user_id == user_id).delete()
    db.commit()
    
    log_admin_action(db, current_user.id, "force_logout", f"Forced logout for {user.email}")
    return {"message": "User logged out successfully"}


@router.post("/users/{user_id}/reset-mfa")
async def reset_user_mfa(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Reset MFA for a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.mfa_state = MFAState.DISABLED
    user.mfa_secret_encrypted = None
    user.mfa_secret_temporary = None
    user.backup_codes_encrypted = None
    user.mfa_recovery_otp = None
    db.commit()
    
    log_admin_action(db, current_user.id, "reset_mfa", f"Reset MFA for {user.email}")
    return {"message": "MFA reset successfully"}


@router.get("/uploads", response_model=List[UploadResponse])
async def list_all_uploads(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all uploads (optionally filtered by user)
    """
    query = db.query(Upload)
    
    if user_id:
        query = query.filter(Upload.user_id == user_id)
    
    uploads = query.order_by(Upload.created_at.desc()).offset(skip).limit(limit).all()
    return uploads


@router.delete("/uploads/{upload_id}")
async def delete_upload(
    upload_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an upload and its related data"""
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    db.delete(upload)
    db.commit()
    
    log_admin_action(db, current_user.id, "delete_upload", f"Deleted upload {upload.filename}")
    return {"message": "Upload deleted"}


@router.get("/alerts", response_model=List[AlertResponse])
async def list_alerts(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all dangerous detection alerts
    """
    query = db.query(Alert).join(Upload).join(User)
    
    if user_id:
        query = query.filter(Alert.user_id == user_id)
    
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    
    results = []
    for alert in alerts:
        results.append({
            "id": str(alert.id),
            "user_id": str(alert.user_id),
            "user_email": alert.user.email,
            "upload_id": str(alert.upload_id),
            "filename": alert.upload.filename,
            "object_name": alert.object_name,
            "threat_level": alert.threat_level.value,
            "confidence": alert.confidence,
            "timestamp": alert.timestamp,
            "image_path": alert.image_path,
            "status": alert.status,
            "admin_notes": alert.admin_notes
        })
    
    return results


@router.patch("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: uuid.UUID,
    update: AlertUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update alert status or notes"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if update.status:
        alert.status = update.status
    if update.admin_notes is not None:
        alert.admin_notes = update.admin_notes
        
    db.commit()
    db.refresh(alert)
    return {
            "id": str(alert.id),
            "user_id": str(alert.user_id),
            "user_email": alert.user.email,
            "upload_id": str(alert.upload_id),
            "filename": alert.upload.filename,
            "object_name": alert.object_name,
            "threat_level": alert.threat_level.value,
            "confidence": alert.confidence,
            "timestamp": alert.timestamp,
            "image_path": alert.image_path,
            "status": alert.status,
            "admin_notes": alert.admin_notes
    }


@router.get("/audit-logs")
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    View audit logs
    """
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for log in logs:
        results.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "status": log.status,
            "meta": log.meta,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user_email": log.user.email if log.user else "System"
        })
    
    return results


@router.post("/reprocess/{upload_id}")
async def reprocess_upload(
    upload_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Reprocess an upload with AI model
    """
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    try:
        # Get file path
        from backend.storage.storage_factory import storage
        file_path = await storage.get_file_url(upload.file_path)
        
        # Run detection again
        detections, annotated_img = ai_service.detect_image(file_path)
        
        # Delete old detections
        db.query(Detection).filter(Detection.upload_id == upload_id).delete()
        
        # Save new detections
        for det in detections:
            detection_record = Detection(
                upload_id=upload.id,
                class_name=det["class_name"],
                confidence=det["confidence"],
                bbox=det["bbox"],
                threat_level=det["threat_level"]
            )
            db.add(detection_record)
        
        # Update summary
        summary = ai_service.get_detection_summary(detections)
        upload.detection_summary = summary
        upload.is_processed = True
        
        db.commit()
        
        return {
            "message": "Upload reprocessed successfully",
            "detections": len(detections),
            "summary": summary
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reprocessing failed: {str(e)}"
        )


@router.get("/export/alerts")
async def export_alerts_csv(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Export all alerts as CSV
    """
    alerts = db.query(Alert).join(Upload).join(User).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Alert ID", "User Email", "Upload ID", "Filename",
        "Object Name", "Threat Level", "Confidence",
        "Timestamp", "Image Path", "Status", "Admin Notes"
    ])
    
    # Write data
    for alert in alerts:
        writer.writerow([
            str(alert.id),
            alert.user.email,
            str(alert.upload_id),
            alert.upload.filename,
            alert.object_name,
            alert.threat_level.value,
            alert.confidence,
            alert.timestamp.isoformat(),
            alert.image_path,
            alert.status.value,
            alert.admin_notes or ""
        ])
    
    # Create response
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=alerts_export.csv"
        }
    )


@router.get("/system/health")
async def system_health(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get system health metrics
    """
    import psutil
    from datetime import datetime
    
    # Database connection check
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # AI model check
    model_status = "loaded" if ai_service._model is not None else "not loaded"
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "ai_model": model_status,
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024 * 1024 * 1024)
        }
    }


@router.get("/settings", response_model=SystemSettingsResponse)
async def get_system_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get system settings"""
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings_obj:
        # Should have been created by migration, but just in case
        settings_obj = SystemSettings(id=1)
        db.add(settings_obj)
        db.commit()
    return settings_obj


@router.put("/settings", response_model=SystemSettingsResponse)
async def update_system_settings(
    settings_update: SystemSettingsUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update system settings"""
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings_obj:
        settings_obj = SystemSettings(id=1)
        db.add(settings_obj)
    
    # Detect security-sensitive changes
    update_data = settings_update.dict(exclude_unset=True)
    mfa_changed = False
    if "mfa_enforced_for_admins" in update_data and update_data["mfa_enforced_for_admins"] != settings_obj.mfa_enforced_for_admins:
        mfa_changed = True
    
    # Update fields from Pydantic model
    for key, value in update_data.items():
        setattr(settings_obj, key, value)
    
    settings_obj.updated_by = current_user.id
    
    db.commit()
    db.refresh(settings_obj)
    
    # Log and Notify if security changed
    action_desc = "Updated system settings"
    if mfa_changed:
        action_desc = f"MFA enforcement for admins: {'ENABLED' if settings_obj.mfa_enforced_for_admins else 'DISABLED'}"
        
        # Notify all admins
        from backend.services.email_service import email_service
        try:
            admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
            for admin in admins:
                # Use background tasks or await directly (await is safer for now if we want to ensure it's handled)
                import asyncio
                asyncio.create_task(email_service.send_security_policy_notification(
                    admin.email,
                    admin.name,
                    action_desc,
                    current_user.name
                ))
        except Exception as e:
            logger.error(f"Failed to notify admins of security change: {e}")

    log_admin_action(db, current_user.id, "update_settings", action_desc)
    return settings_obj


@router.get("/export/audit-logs")
async def export_audit_logs_csv(
    ids: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Export all audit logs as CSV
    """
    query = db.query(AuditLog).join(User, isouter=True)
    
    if ids:
        try:
            id_list = [int(i.strip()) for i in ids.split(',') if i.strip()]
            if id_list:
                query = query.filter(AuditLog.id.in_(id_list))
        except ValueError:
            pass # Ignore malformed IDs
            
    logs = query.order_by(AuditLog.created_at.desc()).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Log ID", "Timestamp", "User Email", "Action", 
        "Resource", "Status", "IP Address", "Metadata"
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            str(log.id),
            log.created_at.isoformat(),
            log.user.email if log.user else "System",
            log.action,
            log.resource or "-",
            log.status,
            log.ip_address,
            str(log.meta) if log.meta else ""
        ])
    
    # Create response
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=audit_logs_export.csv"
        }
    )
