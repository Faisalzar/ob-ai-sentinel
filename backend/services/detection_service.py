"""
Unified Detection Service
Supports both YOLOv8 (local) and Roboflow API (cloud)
"""
import logging
from typing import List, Dict, Any, Tuple
import numpy as np

from backend.core.config import settings
from backend.services.ai_service import AIDetectionService
from backend.services.multi_model_service import create_multi_model_service

logger = logging.getLogger(__name__)


class DetectionService:
    """
    Unified detection service that switches between YOLOv8 and Roboflow
    based on configuration
    """
    
    def __init__(self):
        """Initialize the appropriate detection service (Multi-model Roboflow priority)"""
        # Priority 1: Try Multi-model Roboflow first (if configured)
        multi_model_service = create_multi_model_service()
        if multi_model_service is not None:
            logger.info("Roboflow API configured - using Multi-Model Roboflow detection service (cloud)")
            self.service = multi_model_service
            self.mode = "roboflow-multi"
        else:
            # Priority 2: Fall back to YOLOv8 (local)
            logger.info("Roboflow not configured - using YOLOv8 detection service (local)")
            self.service = AIDetectionService()
            self.mode = "yolov8"
        
        logger.info(f"Detection service initialized in {self.mode} mode")
    
    def detect_image(self, image_path: str) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """
        Detect objects in image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (detections list, annotated image)
        """
        return self.service.detect_image(image_path)
    
    def detect_video(self, video_path: str, output_path: str) -> List[Dict[str, Any]]:
        """
        Detect objects in video
        
        Args:
            video_path: Path to video file
            output_path: Path to save annotated video
            
        Returns:
            List of all detections across frames
        """
        return self.service.detect_video(video_path, output_path)
    
    def get_detection_summary(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from detections
        
        Args:
            detections: List of detection dictionaries
            
        Returns:
            Summary dictionary
        """
        return self.service.get_detection_summary(detections)
    
    def get_mode(self) -> str:
        """Get current detection mode"""
        return self.mode
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the current detection service"""
        return {
            "mode": self.mode,
            "service_type": "local" if self.mode == "yolov8" else "cloud",
            "model": settings.MODEL_PATH if self.mode == "yolov8" else settings.ROBOFLOW_MODEL_ENDPOINT,
            "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
            "iou_threshold": settings.IOU_THRESHOLD
        }


# Global singleton instance
detection_service = DetectionService()
