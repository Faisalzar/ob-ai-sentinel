"""
YOLOv8 AI Detection Service
"""
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO
import logging
import torch

from backend.core.config import settings, get_threat_level, DANGEROUS_CLASSES

logger = logging.getLogger(__name__)


class AIDetectionService:
    """YOLOv8 object detection service (Singleton)"""
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIDetectionService, cls).__new__(cls)
            cls._instance._initialize_model()
        return cls._instance
    
    def _initialize_model(self):
        """Load YOLOv8 model on first instantiation"""
        try:
            model_path = Path(settings.MODEL_PATH)
            if not model_path.exists():
                raise FileNotFoundError(f"Model not found at {model_path}")
            
            # Decide device: prefer configured DEVICE if available, else auto-detect
            configured_device = (settings.DEVICE or "cpu").lower()
            if configured_device.startswith("cuda") and not torch.cuda.is_available():
                logger.warning("settings.DEVICE is cuda but no CUDA device is available; falling back to CPU")
                device = "cpu"
            else:
                # If DEVICE is "auto", pick cuda if available
                if configured_device == "auto":
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                else:
                    device = configured_device
            
            logger.info(f"Loading YOLOv8 model from {model_path} on device: {device}...")
            self._model = YOLO(str(model_path))
            try:
                # ultralytics uses .to() under the hood; this is a hint for clarity
                self._model.to(device)
            except Exception as e:
                logger.warning(f"Could not move YOLO model to device {device}: {e}")
            self._device = device
            logger.info(f"Model loaded successfully on device: {self._device}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect_image(self, image_path: str) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """
        Detect objects in image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (detections list, annotated image)
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Run inference
        results = self._model.predict(
            source=img,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD,
            device=self._device,
            verbose=False
        )
        
        # Process results
        detections = []
        annotated_img = img.copy()
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Extract detection data
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = result.names[class_id]
                
                # Determine threat level
                threat_level = get_threat_level(class_name)
                
                # Color based on threat level
                if threat_level == "dangerous":
                    color = (0, 0, 255)  # Red
                elif threat_level == "caution":
                    color = (0, 255, 255)  # Yellow
                else:
                    color = (0, 255, 0)  # Green
                
                # Draw bounding box
                cv2.rectangle(annotated_img, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                
                # Draw label
                label = f"{class_name}: {confidence:.2f}"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                label_y = max(int(y1), label_size[1] + 10)
                
                # Background for text
                cv2.rectangle(
                    annotated_img,
                    (int(x1), label_y - label_size[1] - 10),
                    (int(x1) + label_size[0], label_y),
                    color,
                    -1
                )
                
                # Text
                cv2.putText(
                    annotated_img,
                    label,
                    (int(x1), label_y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    2
                )
                
                # Add to detections list
                detections.append({
                    "class_name": class_name,
                    "confidence": f"{confidence:.4f}",
                    "bbox": {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2)
                    },
                    "threat_level": threat_level
                })
        
        return detections, annotated_img
    
    def detect_video(self, video_path: str, output_path: str) -> List[Dict[str, Any]]:
        """
        Detect objects in video (frame by frame)
        
        Args:
            video_path: Path to video file
            output_path: Path to save annotated video
            
        Returns:
            List of all detections across frames
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        all_detections = []
        frame_count = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Run inference on frame
                results = self._model.predict(
                    source=frame,
                    conf=settings.CONFIDENCE_THRESHOLD,
                    iou=settings.IOU_THRESHOLD,
                    device=self._device,
                    verbose=False
                )
                
                annotated_frame = frame.copy()
                
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        threat_level = get_threat_level(class_name)
                        
                        # Color based on threat
                        color = (0, 0, 255) if threat_level == "dangerous" else \
                                (0, 255, 255) if threat_level == "caution" else (0, 255, 0)
                        
                        # Draw box and label
                        cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        label = f"{class_name}: {confidence:.2f}"
                        cv2.putText(annotated_frame, label, (int(x1), int(y1) - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        
                        # Store detection
                        all_detections.append({
                            "frame": frame_count,
                            "class_name": class_name,
                            "confidence": f"{confidence:.4f}",
                            "bbox": {"x1": float(x1), "y1": float(y1), "x2": float(x2), "y2": float(y2)},
                            "threat_level": threat_level
                        })
                
                # Write annotated frame
                out.write(annotated_frame)
        
        finally:
            cap.release()
            out.release()
        
        return all_detections
    
    def get_detection_summary(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from detections
        
        Args:
            detections: List of detection dictionaries
            
        Returns:
            Summary dictionary
        """
        if not detections:
            return {
                "total_detections": 0,
                "dangerous_count": 0,
                "caution_count": 0,
                "harmless_count": 0,
                "classes_detected": [],
                "has_dangerous_objects": False
            }
        
        dangerous = [d for d in detections if d["threat_level"] == "dangerous"]
        caution = [d for d in detections if d["threat_level"] == "caution"]
        harmless = [d for d in detections if d["threat_level"] == "harmless"]
        
        classes = list(set(d["class_name"] for d in detections))
        
        return {
            "total_detections": len(detections),
            "dangerous_count": len(dangerous),
            "caution_count": len(caution),
            "harmless_count": len(harmless),
            "classes_detected": classes,
            "has_dangerous_objects": len(dangerous) > 0,
            "dangerous_objects": [d["class_name"] for d in dangerous]
        }


# Global instance
ai_service = AIDetectionService()
