"""
Multi-Model Roboflow Detection Service
Intelligently uses multiple Roboflow models based on image content
"""
import requests
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.core.config import settings, get_threat_level

logger = logging.getLogger(__name__)


# === Shared label logic (aligned with detect_image.py) ===
WEAPON_LABELS = {"gun","pistol","rifle","rifles","firearm","weapon","knife","grenade","rocket launcher","rocket","launcher","rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine","sword","machete","bomb","explosive"}
NON_VIOLENCE_LABELS = {"non violence","non-violence","non_violence","nonviolence","no violence","peace","peaceful"}
FALSE_POSITIVE_LABELS = {"theft mask","mask theft","robber mask","criminal mask","bandit mask","glove","gloves","hand glove","ied","improvised explosive device","explosive device","bomb"}
ANIMAL_LABELS = {"giraffe","zebra","deer","elephant","elephants","lion","tiger","tigers","bear","horse","cow","dog","cat","wolf","fox","monkey","gorilla","leopard","cheetah","antelope","goat","sheep","camel","buffalo"}
VEHICLE_LABELS = {"car","truck","bus","bicycle","bike","motorcycle","motorbike","scooter","moped","vehicle","auto","automobile","van","suv","sedan","autorickshaw","rickshaw","tuk-tuk","three wheeler","auto rickshaw","tuktuk","3 wheeler"}
ELECTRONICS_LABELS = {"cell phone","phone","mobile","smartphone","cellphone"}

CANON_KEYWORDS = [
    ("person", ["person", "human"]),
    ("car", ["car", "automobile", "0"]),
    ("motorcycle", ["motorbike", "motorcycle", "scooter", "moped"]),
    ("bicycle", ["bicycle", "bike", "cycle"]),
    ("autorickshaw", ["autorickshaw", "rickshaw", "tuk-tuk", "three wheeler", "auto rickshaw", "tuktuk", "3 wheeler", "auto", "forklift"]),
    ("vehicle", ["vehicle"]),
    ("cell phone", ["cell phone","cellphone","mobile","smartphone","phone"]),
    ("grenade", ["grenade","hand grenade"]),
    ("gun", ["gun","handgun","pistol","revolver","firearm"]),
    ("rifle", ["rifle","rifles"]),
    ("knife", ["knife","knives"]),
]

WEAPON_KEYWORDS = [
    "gun","pistol","rifle","rifles","firearm","weapon","knife","grenade","rocket","launcher",
    "rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine",
    "sword","machete","bomb","explosive"
]

def canonical_label(label: str) -> str:
    l = (label or "").lower().strip()
    for canon, keys in CANON_KEYWORDS:
        for k in keys:
            if k in l:
                return canon
    return l

def _is_weapon(label: str) -> bool:
    l = (label or "").lower()
    return (l in WEAPON_LABELS) or any(k in l for k in WEAPON_KEYWORDS)

# Label placement matching local script
import cv2 as _cv2

def _rect_overlap(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 <= bx1 or bx2 <= ax1 or ay2 <= by1 or by2 <= ay1)

def _draw_label_clamped(img, x1, y1, label_text, color, placed):
    h, w = img.shape[:2]
    font = _cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.7
    thickness = 2
    (tw, th), base = _cv2.getTextSize(label_text, font, font_scale, thickness)

    candidates = []
    tx_left = max(0, min(x1, w - tw - 1))
    tx_right = max(0, min(x1 + (tw // 2), w - tw - 1))
    ty_above = y1 - 5
    ty_below = min(h - 2, y1 + th + 5)
    if ty_above >= th + 2:
        candidates.append((tx_left, ty_above))
        candidates.append((tx_right, ty_above))
    candidates.append((tx_left, ty_below))
    candidates.append((tx_right, ty_below))
    for dy in (th + 6, 2*(th + 6)):
        ny = min(h - 2, y1 + dy)
        candidates.append((tx_left, ny))
        candidates.append((tx_right, ny))

    for cx, cy in candidates:
        rect = (cx, cy - th, cx + tw, cy)
        ok = True
        for pr in placed:
            if _rect_overlap(rect, pr):
                ok = False
                break
        if ok and rect[0] >= 0 and rect[1] >= 0 and rect[2] <= w and rect[3] <= h:
            _cv2.putText(img, label_text, (cx, cy), font, font_scale, color, thickness, _cv2.LINE_AA)
            placed.append(rect)
            return

    cx = max(0, min(x1, w - tw - 1))
    cy = min(h - 2, y1 + th + 5)
    rect = (cx, cy - th, cx + tw, cy)
    _cv2.putText(img, label_text, (cx, cy), font, font_scale, color, thickness, _cv2.LINE_AA)
    placed.append(rect)

# IoU util for post-processing
def _xyxy_iou(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    denom = area_a + area_b - inter
    return inter / denom if denom > 0 else 0.0

# Priority helpers
def _macro(label: str) -> str:
    l = (label or "").lower()
    if _is_weapon(l):
        return "weapon"
    if l in ELECTRONICS_LABELS:
        return "electronics"
    if l in ANIMAL_LABELS:
        return "animal"
    if l == "person":
        return "person"
    if l in VEHICLE_LABELS:
        return "vehicle"
    return "other"

def _class_priority(label: str) -> float:
    l = (label or "").lower()
    if _is_weapon(l):
        if "knife" in l:
            return 5.2
        if any(k in l for k in ["gun","pistol","rifle","firearm","shotgun"]):
            return 5.1
        return 5.0
    if l == "person":
        return 4.0
    if l in ELECTRONICS_LABELS:
        return 3.0
    if l in {"bicycle","bike","cycle","motorcycle","motorbike","scooter","moped"}:
        return 2.5
    if l in {"truck","bus"}:
        return 2.3
    if l in VEHICLE_LABELS:
        return 2.0
    if l in ANIMAL_LABELS:
        return 1.5
    return 0.0

class MultiModelRoboflowService:
    """
    Multi-model Roboflow detection service that uses multiple models
    to detect different types of objects
    """
    
    def __init__(self, api_key: str):
        """
        Initialize multi-model service
        
        Args:
            api_key: Roboflow API key
        """
        self.api_key = api_key
        self.base_url = "https://detect.roboflow.com"
        
        # Define all available models
        self.models = {
            "weapons": [
                settings.ROBOFLOW_MODEL_ENDPOINT,  # Gun detection
                settings.ROBOFLOW_MODEL_GUNS,      # Guns alternative
                settings.ROBOFLOW_MODEL_GUNS_DATASET,  # Guns dataset
                settings.ROBOFLOW_MODEL_THEFT,     # Theft detection (weapons)
            ],
            "person": [
                settings.ROBOFLOW_MODEL_PERSON,    # Person detection
                settings.ROBOFLOW_MODEL_HUMAN,     # Human detection
            ],
            "vehicles": [
                settings.ROBOFLOW_MODEL_CAR,       # Car detection
            ],
            "animals": [
                settings.ROBOFLOW_MODEL_ANIMAL,    # Animal detection
                settings.ROBOFLOW_MODEL_ANIMALS_ALT,  # Animals alternative
            ],
            "logistics": [
                settings.ROBOFLOW_MODEL_LOGISTICS,  # Logistics
            ],
            "general": [
                settings.ROBOFLOW_MODEL_PREMADE,   # General purpose
            ]
        }
        
        # Filter out None values
        self.active_models = {}
        for category, models in self.models.items():
            active = [m for m in models if m is not None]
            if active:
                self.active_models[category] = active
        
        logger.info(f"Multi-model service initialized with {sum(len(v) for v in self.active_models.values())} models across {len(self.active_models)} categories")
    
    def _detect_with_model(self, image_path: str, model_endpoint: str) -> List[Dict[str, Any]]:
        """
        Detect objects using a single model
        
        Args:
            image_path: Path to image file
            model_endpoint: Model endpoint to use
            
        Returns:
            List of detections
        """
        try:
            url = f"{self.base_url}/{model_endpoint}"
            
            with open(image_path, 'rb') as f:
                response = requests.post(
                    url,
                    params={
                        'api_key': self.api_key,
                        'confidence': 1, # Get EVERYTHING > 1% and let local logic filter it
                        'overlap': int(settings.IOU_THRESHOLD * 100)
                    },
                    files={'file': f},
                    timeout=30
                )
            
            if response.status_code != 200:
                logger.warning(f"Model {model_endpoint} returned status {response.status_code}")
                return []
            
            result = response.json()
            predictions = result.get('predictions', [])
            
            detections = []
            for pred in predictions:
                class_name = pred.get('class', 'unknown')
                confidence = pred.get('confidence', 0.0)
                
                # Filter out common false positive labels (from backup logic)
                FALSE_POSITIVE_LABELS = {
                    "theft mask", "mask theft", "robber mask", "criminal mask", "bandit mask",
                    "glove", "gloves", "hand glove",
                    "ied", "improvised explosive device", "explosive device", "bomb"
                }
                
                # Skip false positive labels entirely (require extremely high confidence)
                if class_name.lower() in FALSE_POSITIVE_LABELS:
                    if confidence < 0.98:  # Extremely high threshold for dangerous false positives
                        logger.info(f"Filtered out false positive label '{class_name}' with confidence {confidence:.2f}")
                        continue
                
                # Additional filters for explosive-related terms
                if any(term in class_name.lower() for term in ['ied', 'explosive', 'bomb', 'improvised']):
                    if confidence < 0.95:  # Very high threshold
                        logger.info(f"Filtered out explosive-related detection: {class_name} ({confidence:.2f})")
                        continue
                
                # Get bounding box
                x_center = pred.get('x', 0)
                y_center = pred.get('y', 0)
                width = pred.get('width', 0)
                height = pred.get('height', 0)
                
                # Convert to corner coordinates
                x1 = x_center - width / 2
                y1 = y_center - height / 2
                x2 = x_center + width / 2
                y2 = y_center + height / 2
                
                detections.append({
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2)
                    },
                    "model": model_endpoint
                })
            
            logger.info(f"Model {model_endpoint}: {len(detections)} detections")
            return detections
            
        except Exception as e:
            logger.error(f"Error with model {model_endpoint}: {e}")
            return []
    
    def _merge_detections(self, all_detections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Merge detections from multiple models, removing duplicates
        
        Args:
            all_detections: List of detection lists from different models
            
        Returns:
            Merged list of unique detections
        """
        if not all_detections:
            return []
        
        # Flatten all detections
        flat_detections = []
        for detections in all_detections:
            flat_detections.extend(detections)
        
        if not flat_detections:
            return []
        
        # Remove duplicates based on IoU (Intersection over Union)
        unique_detections = []
        
        for detection in flat_detections:
            is_duplicate = False
            
            for unique in unique_detections:
                # Check if same class
                if detection['class_name'].lower() == unique['class_name'].lower():
                    # Calculate IoU
                    iou = self._calculate_iou(detection['bbox'], unique['bbox'])
                    
                    # If high overlap, consider duplicate
                    if iou > 0.5:
                        is_duplicate = True
                        # Keep the one with higher confidence
                        if detection['confidence'] > unique['confidence']:
                            unique_detections.remove(unique)
                            unique_detections.append(detection)
                        break
            
            if not is_duplicate:
                unique_detections.append(detection)
        
        logger.info(f"Merged {len(flat_detections)} detections into {len(unique_detections)} unique detections")
        return unique_detections
    
    def _post_process(self, detections: List[Dict[str, Any]], img_shape) -> List[Dict[str, Any]]:
        """Canonicalize, class-specific thresholds, and conflict-aware suppression (phone vs gun, person vs vehicle)."""
        h, w = img_shape[0], img_shape[1]
        image_area = max(1, h * w)

        # Canonicalize labels
        for d in detections:
            d['class_name'] = canonical_label(d.get('class_name', ''))

        # Class-specific requirements
        def req(label: str):
            l = (label or '').lower()
            # Weapons - keep strict for safety
            if 'knife' in l:
                return 0.55, image_area * 0.0015
            if any(k in l for k in ['gun','pistol','rifle','firearm','shotgun']):
                return 0.70, image_area * 0.0020
            if _is_weapon(l):
                return 0.60, image_area * 0.0020
            # People / electronics / vehicles / animals - RELAXED for live camera
            if l == 'person':
                return 0.15, image_area * 0.0001  # Very low threshold for person detection
            if l in ELECTRONICS_LABELS:
                return 0.25, image_area * 0.0001  # Very low for phones
            if l in VEHICLE_LABELS:
                return 0.35, image_area * 0.0020
            if l in ANIMAL_LABELS:
                return 0.25, image_area * 0.0015
            # Everything else
            return 0.30, image_area * 0.0010  # Lower default threshold

        # First stage: basic filtering
        prelim = []
        filtered_count = {'false_positive': 0, 'too_small': 0, 'too_large': 0, 'low_confidence': 0, 'small_area': 0, 'unknown_class': 0}
        for d in detections:
            label = d['class_name']
            conf = float(d['confidence'])
            
            # Filter out unknown/invalid class labels (like '0', '1', etc.)
            if label.isdigit() or label in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                filtered_count['unknown_class'] += 1
                logger.debug(f"Filtered unknown class: '{label}' (conf={conf:.2f})")
                continue
            x1, y1, x2, y2 = d['bbox']['x1'], d['bbox']['y1'], d['bbox']['x2'], d['bbox']['y2']
            bw, bh = max(0.0, x2 - x1), max(0.0, y2 - y1)
            area = bw * bh

            # Drop false positive accessory labels unless extremely confident
            if label in FALSE_POSITIVE_LABELS and conf < 0.98:
                filtered_count['false_positive'] += 1
                logger.debug(f"Filtered false positive: {label} (conf={conf:.2f})")
                continue
            # Global sanity - RELAXED minimum size
            if area < image_area * 0.0005:  # Changed from 0.001 to 0.0005
                filtered_count['too_small'] += 1
                logger.debug(f"Filtered too small: {label} area={area:.0f} < {image_area*0.0005:.0f}")
                continue
            if area > image_area * 0.80:
                filtered_count['too_large'] += 1
                logger.debug(f"Filtered too large: {label}")
                continue
            # Class-specific thresholds
            min_conf, min_area = req(label)
            if conf < min_conf:
                filtered_count['low_confidence'] += 1
                logger.debug(f"Filtered low confidence: {label} conf={conf:.2f} < {min_conf:.2f}")
                continue
            if area < min_area:
                filtered_count['small_area'] += 1
                logger.debug(f"Filtered small area: {label} area={area:.0f} < {min_area:.0f}")
                continue
            prelim.append(d)
        
        if any(filtered_count.values()):
            logger.info(f"Filtered detections: {filtered_count}")
        logger.info(f"After basic filtering: {len(prelim)} detections remain from {len(detections)}")

        # Second stage: global conflict-aware suppression
        items = list(prelim)
        items.sort(key=lambda p: (_class_priority(p['class_name']), float(p['confidence'])), reverse=True)
        kept: List[Dict[str, Any]] = []
        while items:
            best = items.pop(0)
            bx1, by1, bx2, by2 = best['bbox']['x1'], best['bbox']['y1'], best['bbox']['x2'], best['bbox']['y2']
            bxyxy = (bx1, by1, bx2, by2)
            lb = best['class_name'].lower()
            mb = _macro(lb)
            remain = []
            for p in items:
                px1, py1, px2, py2 = p['bbox']['x1'], p['bbox']['y1'], p['bbox']['x2'], p['bbox']['y2']
                pxyxy = (px1, py1, px2, py2)
                iou = _xyxy_iou(bxyxy, pxyxy)
                lp = p['class_name'].lower()
                mp = _macro(lp)
                suppress = False

                # Same class NMS
                if lb == lp and iou >= 0.3:
                    suppress = True
                # Person vs vehicle: prefer person on overlap
                elif {lb, lp} & {"person"} and (lb in VEHICLE_LABELS or lp in VEHICLE_LABELS) and iou >= 0.3:
                    suppress = True
                # Electronics vs gun: prefer phone when overlapping and plausible
                elif (lb in ELECTRONICS_LABELS and _is_weapon(lp)) or (_is_weapon(lb) and lp in ELECTRONICS_LABELS):
                    if iou >= 0.25:
                        conf_b = float(best['confidence']); conf_p = float(p['confidence'])
                        # Keep electronics if its confidence is comparable or high
                        if (lb in ELECTRONICS_LABELS and (conf_b >= conf_p * 0.9 or conf_b >= 0.6)):
                            suppress = (lp not in ELECTRONICS_LABELS)
                        elif (lp in ELECTRONICS_LABELS and (conf_p >= conf_b * 0.9 or conf_p >= 0.6)):
                            suppress = (lb not in ELECTRONICS_LABELS)
                # Same macro (e.g., two vehicles)
                elif mb == mp and mb != "other" and iou >= 0.4:
                    suppress = True
                # General high overlap fallback
                elif iou >= 0.45:
                    suppress = True

                if not suppress:
                    remain.append(p)
            kept.append(best)
            items = remain

        # Weapon-heavy images: keep person plus weapons; otherwise keep all
        has_strong_weapons = any(_is_weapon(d['class_name']) and float(d['confidence']) > 0.7 for d in kept)
        if has_strong_weapons:
            kept = [d for d in kept if _is_weapon(d['class_name']) or d['class_name'] == 'person']

        return kept

    def _calculate_iou(self, bbox1: Dict, bbox2: Dict) -> float:
        """Calculate Intersection over Union between two bounding boxes"""
        x1_min, y1_min, x1_max, y1_max = bbox1['x1'], bbox1['y1'], bbox1['x2'], bbox1['y2']
        x2_min, y2_min, x2_max, y2_max = bbox2['x1'], bbox2['y1'], bbox2['x2'], bbox2['y2']
        
        # Calculate intersection area
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        
        # Calculate union area
        bbox1_area = (x1_max - x1_min) * (y1_max - y1_min)
        bbox2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = bbox1_area + bbox2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0.0
    
    def detect_image(self, image_path: str) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """
        Detect objects in image using multiple models in parallel
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (detections list, annotated image)
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Collect all models to run
        all_models = []
        for category_models in self.active_models.values():
            all_models.extend(category_models)
        
        logger.info(f"Running detection with {len(all_models)} models in parallel...")
        
        # Run models in parallel
        all_detections = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_model = {
                executor.submit(self._detect_with_model, image_path, model): model 
                for model in all_models
            }
            
            for future in as_completed(future_to_model):
                model = future_to_model[future]
                try:
                    detections = future.result()
                    if detections:
                        all_detections.append(detections)
                except Exception as e:
                    logger.error(f"Error processing model {model}: {e}")
        
        # Merge and deduplicate detections
        merged_detections = self._merge_detections(all_detections)
        logger.info(f"After merge: {len(merged_detections)} unique detections")
        
        # Log what we have before post-processing
        for det in merged_detections:
            logger.info(f"  Before filter: {det['class_name']} conf={det['confidence']:.3f} bbox={det['bbox']}")

        # Canonicalize and post-filter to match local behavior
        merged_detections = self._post_process(merged_detections, img.shape)
        logger.info(f"After post-process: {len(merged_detections)} final detections")
        
        # Log what survived
        for det in merged_detections:
            logger.info(f"  Final: {det['class_name']} conf={det['confidence']:.3f}")
        
        # Add threat levels
        for detection in merged_detections:
            detection['threat_level'] = get_threat_level(detection['class_name'])
            detection['confidence'] = f"{float(detection['confidence']):.4f}"
        
        # Annotate image (match local text style/colors)
        annotated_img = self._annotate_image(img, merged_detections)
        
        logger.info(f"Final detection count: {len(merged_detections)} objects")
        return merged_detections, annotated_img
    
    def _annotate_image(self, img: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """Draw boxes and labels like local script (weapons red, others green)"""
        annotated_img = img.copy()
        placed = []
        for det in detections:
            bbox = det['bbox']
            x1, y1, x2, y2 = int(bbox['x1']), int(bbox['y1']), int(bbox['x2']), int(bbox['y2'])
            label = f"{det['class_name']}: {float(det['confidence']):.2f}"
            color = (0, 0, 255) if _is_weapon(det['class_name']) else (0, 255, 0)
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
            _draw_label_clamped(annotated_img, x1, y1, label, color, placed)
        return annotated_img
    
    def detect_video(self, video_path: str, output_path: str) -> List[Dict[str, Any]]:
        """
        Detect objects in video using multiple models
        
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
        frame_skip = max(1, fps // 2)  # Process 2 frames per second
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                if frame_count % frame_skip != 0:
                    out.write(frame)
                    continue
                
                # Save frame temporarily
                temp_frame_path = f"temp_frame_{frame_count}.jpg"
                cv2.imwrite(temp_frame_path, frame)
                
                try:
                    detections, annotated_frame = self.detect_image(temp_frame_path)
                    
                    for detection in detections:
                        detection['frame'] = frame_count
                        all_detections.append(detection)
                    
                    out.write(annotated_frame)
                    
                except Exception as e:
                    logger.error(f"Error processing frame {frame_count}: {e}")
                    out.write(frame)
                
                finally:
                    Path(temp_frame_path).unlink(missing_ok=True)
        
        finally:
            cap.release()
            out.release()
        
        return all_detections
    
    def get_detection_summary(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics from detections"""
        if not detections:
            return {
                "total_detections": 0,
                "dangerous_count": 0,
                "caution_count": 0,
                "harmless_count": 0,
                "classes_detected": [],
                "has_dangerous_objects": False,
                "dangerous_objects": []
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


def create_multi_model_service() -> Optional[MultiModelRoboflowService]:
    """
    Create multi-model Roboflow service if API key is available
    
    Returns:
        MultiModelRoboflowService instance or None if API key not available
    """
    api_key = getattr(settings, 'ROBOFLOW_API_KEY', None)
    
    if api_key:
        logger.info("Creating multi-model Roboflow service")
        return MultiModelRoboflowService(api_key)
    else:
        logger.warning("Roboflow API key not configured")
        return None
