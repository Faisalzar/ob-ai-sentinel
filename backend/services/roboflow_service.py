"""
Roboflow API Detection Service
"""
import requests
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import logging
import base64

from backend.core.config import settings, get_threat_level

logger = logging.getLogger(__name__)


class RoboflowDetectionService:
    """Roboflow API object detection service"""
    
    def __init__(self, api_key: str, model_endpoint: str):
        """
        Initialize Roboflow service
        
        Args:
            api_key: Roboflow API key
            model_endpoint: Roboflow model endpoint URL
        """
        self.api_key = api_key
        self.model_endpoint = model_endpoint
        self.base_url = "https://detect.roboflow.com"
        logger.info("Roboflow service initialized")
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 for API request"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def detect_image(self, image_path: str) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """
        Detect objects in image using Roboflow API
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (detections list, annotated image)
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Prepare API request
        url = f"{self.base_url}/{self.model_endpoint}"
        
        # Option 1: Send file directly
        with open(image_path, 'rb') as f:
            response = requests.post(
                url,
                params={
                    'api_key': self.api_key,
                    'confidence': int(settings.CONFIDENCE_THRESHOLD * 100),
                    'overlap': int(settings.IOU_THRESHOLD * 100)
                },
                files={'file': f},
                timeout=30
            )
        
        if response.status_code != 200:
            raise Exception(f"Roboflow API error: {response.status_code} - {response.text}")
        
        # Parse response
        result = response.json()
        predictions = result.get('predictions', [])
        
        # Process results
        detections = []
        annotated_img = img.copy()
        
        for pred in predictions:
            # Extract detection data
            class_name = pred.get('class', 'unknown')
            confidence = pred.get('confidence', 0.0)
            
            # Get bounding box (Roboflow uses center x, y, width, height)
            x_center = pred.get('x', 0)
            y_center = pred.get('y', 0)
            width = pred.get('width', 0)
            height = pred.get('height', 0)
            
            # Convert to corner coordinates
            x1 = x_center - width / 2
            y1 = y_center - height / 2
            x2 = x_center + width / 2
            y2 = y_center + height / 2
            
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
        Detect objects in video using Roboflow API (frame by frame)
        
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
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        all_detections = []
        frame_count = 0
        
        # Process every Nth frame to reduce API calls
        frame_skip = max(1, fps // 2)  # Process 2 frames per second
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Skip frames to reduce API usage
                if frame_count % frame_skip != 0:
                    out.write(frame)
                    continue
                
                # Save frame temporarily
                temp_frame_path = f"temp_frame_{frame_count}.jpg"
                cv2.imwrite(temp_frame_path, frame)
                
                try:
                    # Detect objects in frame
                    detections, annotated_frame = self.detect_image(temp_frame_path)
                    
                    # Add frame number to each detection
                    for detection in detections:
                        detection['frame'] = frame_count
                        all_detections.append(detection)
                    
                    out.write(annotated_frame)
                    
                except Exception as e:
                    logger.error(f"Error processing frame {frame_count}: {e}")
                    out.write(frame)
                
                finally:
                    # Clean up temp file
                    Path(temp_frame_path).unlink(missing_ok=True)
        
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


# Factory function to create Roboflow service
def create_roboflow_service(api_key: Optional[str] = None, 
                            model_endpoint: Optional[str] = None) -> Optional[RoboflowDetectionService]:
    """
    Create Roboflow service instance if credentials are available
    
    Args:
        api_key: Roboflow API key (optional, reads from settings if not provided)
        model_endpoint: Model endpoint (optional, reads from settings if not provided)
        
    Returns:
        RoboflowDetectionService instance or None if credentials not available
    """
    api_key = api_key or getattr(settings, 'ROBOFLOW_API_KEY', None)
    model_endpoint = model_endpoint or getattr(settings, 'ROBOFLOW_MODEL_ENDPOINT', None)
    
    logger.info(f"Checking Roboflow configuration: API Key={'SET' if api_key else 'NOT SET'}, Model Endpoint={model_endpoint or 'NOT SET'}")
    
    if api_key and model_endpoint:
        logger.info(f"Roboflow API configured with model: {model_endpoint}")
        return RoboflowDetectionService(api_key, model_endpoint)
    else:
        logger.warning(f"Roboflow credentials not configured - API Key: {api_key is not None}, Model: {model_endpoint is not None}")
        return None
