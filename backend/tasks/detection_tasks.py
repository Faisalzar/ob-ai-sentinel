"""
Detection Celery Tasks
Async video processing for better performance
"""
import logging
from pathlib import Path
from datetime import datetime
import uuid

from backend.celery_app import celery_app
from backend.services.detection_service import detection_service
from backend.db.base import SessionLocal
from backend.models.models import Upload, Detection, Alert, ThreatLevel
from backend.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="process_video_async")
def process_video_async(self, upload_id: str, video_path: str, user_id: str):
    """
    Process video detection asynchronously
    
    Args:
        self: Celery task instance
        upload_id: Upload record ID
        video_path: Path to video file
        user_id: User ID
        
    Returns:
        Detection summary
    """
    db = SessionLocal()
    
    try:
        # Get upload record
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            raise ValueError(f"Upload {upload_id} not found")
        
        # Generate output path
        output_filename = f"{uuid.uuid4()}_annotated.mp4"
        output_dir = Path(settings.LOCAL_OUTPUT_PATH) / f"user_{user_id}"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / output_filename)
        
        # Update task progress
        self.update_state(state='PROCESSING', meta={'progress': 0})
        
        # Run video detection
        logger.info(f"Processing video: {video_path}")
        detections = detection_service.detect_video(video_path, output_path)
        
        # Update progress
        self.update_state(state='SAVING', meta={'progress': 80})
        
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
                alert = Alert(
                    upload_id=upload.id,
                    user_id=user_id,
                    object_name=det["class_name"],
                    threat_level=ThreatLevel.DANGEROUS,
                    confidence=det["confidence"],
                    bbox=det["bbox"],
                    image_path=output_path,
                    logged_to_file=True
                )
                db.add(alert)
                warnings.append(f"⚠️ DANGEROUS: {det['class_name']} detected")
        
        # Get summary
        summary = detection_service.get_detection_summary(detections)
        
        # Update upload record
        upload.detection_summary = summary
        upload.annotated_path = output_path
        upload.is_processed = True
        upload.processed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Video processing completed: {upload_id}")
        
        return {
            "status": "completed",
            "summary": summary,
            "annotated_path": output_path,
            "warnings": warnings
        }
        
    except Exception as e:
        logger.error(f"Video processing failed: {e}")
        
        # Update upload with error
        if upload:
            upload.processing_error = str(e)
            db.commit()
        
        raise
        
    finally:
        db.close()
