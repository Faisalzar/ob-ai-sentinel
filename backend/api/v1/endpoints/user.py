"""
User API endpoints - Detection and uploads
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import cv2
import os
import cv2
import os
import re
from pathlib import Path

from backend.db.base import get_db
from backend.models.models import User, Upload, Detection, Alert, FileType, ThreatLevel, AlertStatus, SystemSettings
from backend.schemas.user import DetectionResponse, UserStatsResponse, UploadResponse, DetectionResult, DetectionBox, DetectionSummary, UserChangePassword, UserUpdate, UserResponse, SystemSettingsPublic
from backend.core.dependencies import get_current_active_user_strict as get_current_active_user
from backend.services.detection_service import detection_service
from backend.storage.storage_factory import storage
from backend.core.config import settings
from backend.core.security import verify_password, hash_password

router = APIRouter(prefix="", tags=["User"])


@router.get("/system/settings", response_model=SystemSettingsPublic)
async def get_public_settings(
    db: Session = Depends(get_db)
):
    """
    Get public system settings (upload limits, engines, etc.)
    """
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings_obj:
        # Return defaults if no settings in DB
        return SystemSettingsPublic(
            max_image_size_mb=5,
            max_video_size_mb=50,
            primary_engine="roboflow",
            min_confidence=40,
            allowed_file_types=["image/jpeg", "image/png", "video/mp4"],
            maintenance_mode=False
        )
    return settings_obj


@router.post("/user/change-password")
async def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Check if new password is same as current
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the current password"
        )
        
    # Check password length
    if len(password_data.new_password) < settings.MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters"
        )

    # Check for uppercase character
    if not re.search(r"[A-Z]", password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )

    # Check for digit
    if not re.search(r"\d", password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )

    # Check for special character
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character"
        )

    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password - Fetch explicit instance to ensure attachment to current session
    user = db.query(User).filter(User.id == current_user.id).first()
    user.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}


@router.put("/user/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile
    """
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if user_update.name:
        user.name = user_update.name
        
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/user/update-profile", response_model=UserResponse)
async def update_profile_alias(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile (Alias)
    """
    return await update_profile(user_update, current_user, db)


async def save_alert(db: Session, user_id: uuid.UUID, upload_id: uuid.UUID, detection: dict, image_path: str):
    """Save dangerous detection as alert"""
    alert = Alert(
        upload_id=upload_id,
        user_id=user_id,
        object_name=detection["class_name"],
        threat_level=ThreatLevel.DANGEROUS,
        confidence=detection["confidence"],
        bbox=detection["bbox"],
        image_path=image_path,
        logged_to_file=True,
        status=AlertStatus.NEW
    )
    db.add(alert)
    
    # Log to file
    alert_log_path = Path(settings.ALERT_LOG_PATH)
    alert_log_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(alert_log_path, "a", encoding="utf-8") as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(
            f"[{timestamp}] WARNING: Weapon Detected -> {detection['class_name']} "
            f"in file: {image_path} (user_id: {user_id})\n"
        )


@router.post("/detect/image", response_model=DetectionResponse)
async def detect_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Detect objects in uploaded image
    """
    # Get system settings
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    max_size_mb = settings_obj.max_image_size_mb if settings_obj else 5
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file content
    file_content = await file.read()
    
    # Check file size
    if len(file_content) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds limit of {max_size_mb}MB"
        )
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"user_{current_user.id}/{unique_filename}"
    
    # Save uploaded file
    saved_path = await storage.save_file(file_content, file_path)
    
    # Determine file type
    is_live_capture = file.filename.startswith("live_capture_") or file.filename == "frame.jpg"
    upload_type = FileType.LIVE if is_live_capture else FileType.IMAGE
    
    # Create upload record
    upload = Upload(
        user_id=current_user.id,
        filename=file.filename,
        file_type=upload_type,
        file_path=file_path,
        file_size=len(file_content)
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    try:
        # If saved_path is a URL (Cloudinary), download it to a temporary file first
        is_remote = saved_path.startswith("http://") or saved_path.startswith("https://")
        inference_path = saved_path
        
        if is_remote:
            import requests
            import tempfile
            response = requests.get(saved_path)
            if response.status_code == 200:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
                temp_file.write(response.content)
                temp_file.close()
                inference_path = temp_file.name
            else:
                raise Exception(f"Failed to download image from storage: {response.status_code}")

        # Run detection
        detections, annotated_img = detection_service.detect_image(inference_path)
        
        # Clean up temp file if remote
        if is_remote:
            import os
            try:
                os.remove(inference_path)
            except Exception:
                pass
        
        # Save annotated image
        annotated_filename = f"{uuid.uuid4()}_annotated{file_ext}"
        annotated_path = f"outputs/user_{current_user.id}/{annotated_filename}"
        annotated_full_path = Path(settings.LOCAL_OUTPUT_PATH) / f"user_{current_user.id}"
        annotated_full_path.mkdir(parents=True, exist_ok=True)
        
        annotated_file_path = annotated_full_path / annotated_filename
        cv2.imwrite(str(annotated_file_path), annotated_img)
        
        # Save detections to database
        warnings = []
        for det in detections:
            detection_record = Detection(
                upload_id=upload.id,
                class_name=det["class_name"],
                confidence=det["confidence"],
                bbox=det["bbox"],
                threat_level=ThreatLevel(det["threat_level"])
            )
            db.add(detection_record)
            
            # Create alert for dangerous objects
            if det["threat_level"] == "dangerous":
                await save_alert(db, current_user.id, upload.id, det, str(annotated_file_path))
                warnings.append(f"⚠️ DANGEROUS: {det['class_name']} detected with {float(det['confidence'])*100:.1f}% confidence")
        
        # Get summary
        summary = detection_service.get_detection_summary(detections)
        
        # Update upload
        upload.detection_summary = summary
        upload.annotated_path = str(annotated_file_path)
        upload.is_processed = True
        upload.processed_at = datetime.utcnow()
        
        db.commit()
        
        # Prepare response
        detection_results = [
            DetectionResult(
                class_name=d["class_name"],
                confidence=d["confidence"],
                bbox=DetectionBox(**d["bbox"]),
                threat_level=d["threat_level"]
            )
            for d in detections
        ]
        
        return DetectionResponse(
            upload_id=upload.id,
            filename=file.filename,
            detections=detection_results,
            summary=DetectionSummary(**summary),
            annotated_url=f"/api/v1/outputs/user_{current_user.id}/{annotated_filename}",
            warnings=warnings
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        upload.processing_error = str(e)
        try:
            db.commit()
        except:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection failed: {str(e)}\n\nTraceback:\n{error_details}"
        )


async def process_video_background(upload_id: str, video_path: str, user_id: str):
    """Background task for video processing without Celery"""
    from backend.db.base import SessionLocal
    db = SessionLocal()
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            return
            
        # Download from Cloudinary if needed
        is_remote = video_path.startswith("http://") or video_path.startswith("https://")
        inference_path = video_path
        
        if is_remote:
            import requests
            import tempfile
            response = requests.get(video_path)
            if response.status_code == 200:
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
                temp_file.write(response.content)
                temp_file.close()
                inference_path = temp_file.name
            else:
                raise Exception(f"Failed to download video: {response.status_code}")
                
        # Generate output path
        output_filename = f"{uuid.uuid4()}_annotated.mp4"
        output_dir = Path(settings.LOCAL_OUTPUT_PATH) / f"user_{user_id}"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / output_filename)
        
        # Run detection
        detections = detection_service.detect_video(inference_path, output_path)
        
        # Clean up temp file if remote
        if is_remote:
            import os
            try:
                os.remove(inference_path)
            except Exception:
                pass
                
        # Save detections to database
        warnings = []
        for det in detections:
            detection_record = Detection(
                upload_id=upload.id,
                class_name=det["class_name"],
                confidence=det["confidence"],
                bbox=det["bbox"],
                threat_level=ThreatLevel(det["threat_level"])
            )
            db.add(detection_record)
            
            # Create alert for dangerous objects
            if det["threat_level"] == "dangerous":
                await save_alert(db, upload.user_id, upload.id, det, output_path)
                warnings.append(f"⚠️ DANGEROUS: {det['class_name']} detected")
                
        # Get summary
        summary = detection_service.get_detection_summary(detections)
        
        # Update upload record
        upload.detection_summary = summary
        upload.annotated_path = output_path
        upload.is_processed = True
        upload.processed_at = datetime.utcnow()
        
        db.commit()
    except Exception as e:
        if 'upload' in locals() and upload:
            upload.processing_error = str(e)
            try:
                db.commit()
            except:
                db.rollback()
    finally:
        db.close()

@router.post("/detect/video", response_model=DetectionResponse)
async def detect_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Detect objects in uploaded video (Async using BackgroundTasks)
    """
    
    # Get system settings
    settings_obj = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    max_size_mb = settings_obj.max_video_size_mb if settings_obj else 50
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a video"
        )
    
    # Read file content
    file_content = await file.read()
    
    # Check file size
    if len(file_content) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video size exceeds limit of {max_size_mb}MB"
        )
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"user_{current_user.id}/{unique_filename}"
    
    # Save uploaded file
    saved_path = await storage.save_file(file_content, file_path)
    
    # Create upload record
    upload = Upload(
        user_id=current_user.id,
        filename=file.filename,
        file_type=FileType.VIDEO,
        file_path=file_path,
        file_size=len(file_content)
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    # Start async task
    try:
        background_tasks.add_task(process_video_background, str(upload.id), saved_path, str(current_user.id))
        
        return DetectionResponse(
            upload_id=upload.id,
            filename=file.filename,
            detections=[],
            summary=DetectionSummary(objects_detected=0, dangerous_objects=0, total_confidence=0),
            annotated_url="",
            warnings=["Video is being processed asynchronously. Results will appear in history soon."]
        )
    except Exception as e:
        upload.processing_error = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video processing failed to start: {str(e)}"
        )



@router.get("/user/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user statistics including last 24 hours detections
    """
    # Calculate 24 hours ago timestamp
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Get upload count by type
    total_uploads = db.query(Upload).filter(Upload.user_id == current_user.id).count()
    
    image_count = db.query(Upload).filter(
        Upload.user_id == current_user.id,
        Upload.file_type == FileType.IMAGE
    ).count()
    
    video_count = db.query(Upload).filter(
        Upload.user_id == current_user.id,
        Upload.file_type == FileType.VIDEO
    ).count()

    live_count = db.query(Upload).filter(
        Upload.user_id == current_user.id,
        Upload.file_type == FileType.LIVE
    ).count()
    
    # Get detection count
    total_detections = db.query(Detection).join(Upload).filter(
        Upload.user_id == current_user.id
    ).count()
    
    # Get dangerous detections count (alerts)
    dangerous_alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id
    ).count()
    
    # Get recent uploads from last 24 hours with detections
    recent_uploads = db.query(Upload).filter(
        Upload.user_id == current_user.id,
        Upload.created_at >= twenty_four_hours_ago
    ).order_by(Upload.created_at.desc()).limit(100).all()
    
    return UserStatsResponse(
        total_uploads=total_uploads,
        total_detections=total_detections,
        dangerous_detections=dangerous_alerts,
        image_count=image_count,
        video_count=video_count,
        live_count=live_count,
        dangerous_alerts=dangerous_alerts,
        active_cameras=live_count,  # Use live streams as active cameras
        latency_ms=42,  # Placeholder, can be calculated from processing times
        recent_uploads=recent_uploads
    )


@router.get("/uploads/{upload_id}", response_model=UploadResponse)
async def get_upload(
    upload_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific upload details
    """
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    return upload


@router.delete("/uploads/{upload_id}")
async def delete_upload(
    upload_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete upload and associated data
    """
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Delete files from storage
    try:
        await storage.delete_file(upload.file_path)
        if upload.annotated_path:
            await storage.delete_file(upload.annotated_path)
    except Exception as e:
        print(f"Error deleting files: {e}")
    
    # Delete database record (cascades to detections and alerts)
    db.delete(upload)
    db.commit()
    
    return {"message": "Upload deleted successfully"}


@router.get("/outputs/{file_path:path}")
async def serve_output_file(
    file_path: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Serve annotated output files
    Only users can access their own files
    """
    # Ensure user can only access their own files
    expected_prefix = f"user_{current_user.id}/"
    print(f"File path requested: {file_path}")
    print(f"Expected prefix: {expected_prefix}")
    print(f"User ID: {current_user.id}")
    
    if not file_path.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    full_path = Path(settings.LOCAL_OUTPUT_PATH) / file_path
    
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(full_path)
