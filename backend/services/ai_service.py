"""
YOLOv8 AI Detection Service
"""
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
import logging

from backend.core.config import settings, get_threat_level, DANGEROUS_CLASSES

logger = logging.getLogger(__name__)


class AIDetectionService:
    """YOLOv8 object detection service (Singleton)"""
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIDetectionService, cls).__new__(cls)
            # Model initialization deferred until first use to save memory
            cls._instance._model = None
            cls._instance._device = None
        return cls._instance

    def _ensure_model_loaded(self):
        """Ensure model is loaded before inference"""
        if self._model is None:
            logger.info("Lazy loading YOLOv8 model for first use...")
            self._initialize_model()
    
    def _initialize_model(self):
        """Load YOLOv8 model on first instantiation"""
        try:
            from ultralytics import YOLO
            import torch
            
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
        
        # Ensure model is loaded
        self._ensure_model_loaded()

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
                
                # Color based on threat level (Matches Web UI Hex Codes in BGR format)
                if threat_level == "dangerous":
                    color = (68, 68, 239)  # Red (#ef4444)
                elif threat_level == "caution":
                    color = (8, 179, 234)  # Yellow (#eab308)
                else:
                    color = (94, 197, 34)  # Green (#22c55e)
                
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
        
        # Ensure model is loaded
        self._ensure_model_loaded()

        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Video writer (use mp4v which works universally, FFmpeg handles web conversion later)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        all_detections = []
        frame_count = 0
        
        # Process ~3 frames per second to speed up local analysis significantly
        # If fps < 3, process every frame.
        frame_skip = max(1, int(fps // 3))
        
        last_results_boxes = [] # Store the raw boxes logic or just the drawn annotated frame logic
        # Actually, it's easier to store the detections and draw them again.
        last_detections_for_frame = []
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                if frame_count % frame_skip != 0 and frame_count != 1:
                    # Skip frame inference, just draw last detections
                    annotated_frame = frame.copy()
                    for det in last_detections_for_frame:
                        x1, y1, x2, y2 = det["xyxy"]
                        class_name = det["class_name"]
                        confidence = det["confidence"]
                        threat_level = det["threat_level"]
                        
                        color = (68, 68, 239) if threat_level == "dangerous" else \
                                (8, 179, 234) if threat_level == "caution" else (94, 197, 34)
                        
                        cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        label = f"{class_name}: {confidence:.2f}"
                        cv2.putText(annotated_frame, label, (int(x1), int(y1) - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
                    out.write(annotated_frame)
                    continue
                
                # Run inference on frame
                results = self._model.predict(
                    source=frame,
                    conf=settings.CONFIDENCE_THRESHOLD,
                    iou=settings.IOU_THRESHOLD,
                    device=self._device,
                    verbose=False
                )
                
                annotated_frame = frame.copy()
                last_detections_for_frame = []
                
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        threat_level = get_threat_level(class_name)
                        
                        # Color based on threat
                        color = (68, 68, 239) if threat_level == "dangerous" else \
                                (8, 179, 234) if threat_level == "caution" else (94, 197, 34)
                        
                        # Draw box and label
                        cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        label = f"{class_name}: {confidence:.2f}"
                        cv2.putText(annotated_frame, label, (int(x1), int(y1) - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        
                        # Store detection for final summary
                        all_detections.append({
                            "frame": frame_count,
                            "class_name": class_name,
                            "confidence": f"{confidence:.4f}",
                            "bbox": {"x1": float(x1), "y1": float(y1), "x2": float(x2), "y2": float(y2)},
                            "threat_level": threat_level
                        })
                        
                        # Store for skipped frames
                        last_detections_for_frame.append({
                            "xyxy": (float(x1), float(y1), float(x2), float(y2)),
                            "class_name": class_name,
                            "confidence": confidence,
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
