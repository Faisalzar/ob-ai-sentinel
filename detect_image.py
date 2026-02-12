import os
import sys
import json
import cv2
from pathlib import Path
try:
    from inference_sdk import InferenceHTTPClient
    HAS_ROBOFLOW = True
except Exception:
    HAS_ROBOFLOW = False
    InferenceHTTPClient = None  # type: ignore
from ultralytics import YOLO

CONFIDENCE_THRESHOLD = 0.25
WEAPON_CONFIDENCE_THRESHOLD = 0.60
MIN_BOX_AREA = 200  # pixels^2 (default; class-specific overrides apply)
# Support multiple keys/models via env lists; fall back to single env or defaults
DEFAULT_API_KEY = "RiAH9d9sVrQjjXrULxl5"
DEFAULT_MODELS = ["animal-detection-ofnht/1", "person-voffo/3", "theft-detection-2jc5t/9", "logistics-sz9jr/2", "car-detection-yd6mb/1", "gundetection-ydunq/2", "human-az20v/4", "guns-30vbz/2", "guns-dataset-1ggvd/1", "animals-cq6th/3", "premade-gduc5/3"]
API_CONFIDENCE = 0.12 # balanced threshold for stable detection
API_OVERLAP = 20       # moderate NMS IoU on API to reduce duplicate boxes
WEAPON_LABELS = {"gun","pistol","rifle","rifles","firearm","weapon","knife","grenade","rocket launcher","rocket","launcher","rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine","sword","machete","bomb","explosive"}
NON_VIOLENCE_LABELS = {"non violence","non-violence","non_violence","nonviolence","no violence","peace","peaceful"}
FALSE_POSITIVE_LABELS = {"theft mask","mask theft","robber mask","criminal mask","bandit mask","glove","gloves","hand glove","ied","improvised explosive device","explosive device","bomb"}
ANIMAL_LABELS = {"giraffe","zebra","deer","elephant","elephants","lion","tiger","tigers","bear","horse","cow","dog","cat","wolf","fox","monkey","gorilla","leopard","cheetah","antelope","goat","sheep","camel","buffalo"}
VEHICLE_LABELS = {"car","truck","bus","bicycle","bike","motorcycle","motorbike","scooter","moped","vehicle","auto","automobile","van","suv","sedan","autorickshaw","rickshaw","tuk-tuk","three wheeler","auto rickshaw","tuktuk","3 wheeler"}
ELECTRONICS_LABELS = {"cell phone","phone","mobile","smartphone","cellphone"}
APPAREL_LABELS = set()  # Removed glove as it causes too many false positives
ANNOTATIONS_JSON = "annotations.json"

# Canonical labels to avoid duplicate names for the same object
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

def canonical_label(label: str) -> str:
    l = (label or "").lower().strip()
    for canon, keys in CANON_KEYWORDS:
        for k in keys:
            if k in l:
                return canon
    return l

WEAPON_KEYWORDS = [
    "gun","pistol","rifle","rifles","firearm","weapon","knife","grenade","rocket","launcher",
    "rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine",
    "sword","machete","bomb","explosive"
]

def _is_weapon(label: str) -> bool:
    l = (label or "").lower()
    return (l in WEAPON_LABELS) or any(k in l for k in WEAPON_KEYWORDS)


def _rect_overlap(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 <= bx1 or bx2 <= ax1 or ay2 <= by1 or by2 <= ay1)


def _draw_label_clamped(img, x1, y1, label_text, color, placed):
    h, w = img.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    # Fixed font settings for consistent appearance like sg.jpg
    font_scale = 0.7
    thickness = 2
    (tw, th), base = cv2.getTextSize(label_text, font, font_scale, thickness)

    # Candidate positions (tx, ty baseline)
    candidates = []
    tx_left = max(0, min(x1, w - tw - 1))
    tx_right = max(0, min(x1 + (tw // 2), w - tw - 1))
    # above/below left
    ty_above = y1 - 5
    ty_below = min(h - 2, y1 + th + 5)
    if ty_above >= th + 2:
        candidates.append((tx_left, ty_above))
        candidates.append((tx_right, ty_above))
    candidates.append((tx_left, ty_below))
    candidates.append((tx_right, ty_below))
    # slight vertical stacking attempts
    for dy in (th + 6, 2*(th + 6)):
        ny = min(h - 2, y1 + dy)
        candidates.append((tx_left, ny))
        candidates.append((tx_right, ny))

    # Choose first non-overlapping placement
    for cx, cy in candidates:
        rect = (cx, cy - th, cx + tw, cy)
        ok = True
        for pr in placed:
            if _rect_overlap(rect, pr):
                ok = False
                break
        if ok and rect[0] >= 0 and rect[1] >= 0 and rect[2] <= w and rect[3] <= h:
            cv2.putText(img, label_text, (cx, cy), font, font_scale, color, thickness, cv2.LINE_AA)
            placed.append(rect)
            return

    # Fallback: clamp below
    cx = max(0, min(x1, w - tw - 1))
    cy = min(h - 2, y1 + th + 5)
    rect = (cx, cy - th, cx + tw, cy)
    cv2.putText(img, label_text, (cx, cy), font, font_scale, color, thickness, cv2.LINE_AA)
    placed.append(rect)


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


def _nms(preds, iou_thresh=0.4):
    out = []
    by_cls = {}
    for p in preds:
        by_cls.setdefault(str(p.get("class", "obj")).lower(), []).append(p)
    for cls, items in by_cls.items():
        items = sorted(items, key=lambda p: float(p.get("confidence", 0)), reverse=True)
        kept = []
        while items:
            best = items.pop(0)
            bx = int(best["x"]) ; by = int(best["y"]) ; bw = int(best["width"]) ; bh = int(best["height"]) 
            bxyxy = (bx - bw // 2, by - bh // 2, bx + bw // 2, by + bh // 2)
            kept.append(best)
            remain = []
            for p in items:
                px = int(p["x"]) ; py = int(p["y"]) ; pw = int(p["width"]) ; ph = int(p["height"]) 
                pxyxy = (px - pw // 2, py - ph // 2, px + pw // 2, py + ph // 2)
                if _xyxy_iou(bxyxy, pxyxy) <= iou_thresh:
                    remain.append(p)
            items = remain
        out.extend(kept)
    return out


def _class_priority(label: str) -> int:
    l = (label or "").lower()
    # Weapons highest with sub-priorities, then person, then electronics, then specific vehicles, then general vehicles, then animals
    if _is_weapon(l):
        # Sub-priorities within weapons to help with knife vs gun conflicts
        if "knife" in l:
            return 5.2  # Knives slightly higher priority (more specific shape)
        elif any(k in l for k in ["gun", "pistol", "rifle", "firearm"]):
            return 5.1  # Guns high priority but slightly lower than knives
        else:
            return 5.0  # Other weapons
    if l == "person":
        return 4  # Person gets higher priority than vehicles
    if l in ELECTRONICS_LABELS:
        return 3
    # Specific vehicle types get higher priority than generic "vehicle" or "car"
    if l in {"bicycle", "bike", "cycle", "motorcycle", "motorbike", "scooter", "moped"}:
        return 2.5  # Bikes/motorcycles more specific than cars
    if l in {"truck", "bus"}:
        return 2.3  # Large vehicles more specific than generic car
    if l in VEHICLE_LABELS:
        return 2  # General vehicles get lower priority
    if l in ANIMAL_LABELS:
        return 1.5  # Slightly higher priority for animals
    return 0


def _macro(label: str) -> str:
    l = (label or "").lower()
    if _is_weapon(l):
        return "weapon"
    if l in ELECTRONICS_LABELS:
        return "electronics"
    if l in APPAREL_LABELS:
        return "apparel"
    if l in ANIMAL_LABELS:
        return "animal"
    if l == "person":
        return "person"
    if l in VEHICLE_LABELS:
        return "vehicle"
    return "other"


def _global_nms(preds, iou_thresh=0.10):  # Minimal to preserve all detections including rickshaws
    # Enhanced NMS with better cross-class conflict resolution
    items = list(preds)
    items.sort(key=lambda p: (_class_priority(p.get("class")), float(p.get("confidence", 0))), reverse=True)
    kept = []
    while items:
        best = items.pop(0)
        bx = int(best["x"]) ; by = int(best["y"]) ; bw = int(best["width"]) ; bh = int(best["height"]) 
        bxyxy = (bx - bw // 2, by - bh // 2, bx + bw // 2, by + bh // 2)
        kept.append(best)
        remain = []
        for p in items:
            px = int(p["x"]) ; py = int(p["y"]) ; pw = int(p["width"]) ; ph = int(p["height"]) 
            pxyxy = (px - pw // 2, py - ph // 2, px + pw // 2, py + ph // 2)
            iou = _xyxy_iou(bxyxy, pxyxy)
            
            lb = str(best.get("class", "")).lower()
            lp = str(p.get("class", "")).lower()
            mb = _macro(lb)
            mp = _macro(lp)
            
            suppress = False
            
            # Same class - less aggressive for weapons to avoid suppressing multiple weapons
            if lb == lp:
                if _is_weapon(lb):
                    # Higher IoU threshold for weapons to preserve multiple weapon detections
                    suppress = True if iou >= 0.5 else False
                else:
                    # Standard threshold for non-weapons
                    suppress = True if iou >= 0.3 else False
            # Person vs Vehicle conflict - always choose person if significant overlap
            elif {lb, lp} == {"person", "car"} or {lb, lp} == {"person", "truck"} or {lb, lp} == {"person", "bus"} or {lb, lp} == {"person", "vehicle"}:
                if iou >= 0.3:  # Lower threshold for person vs vehicle
                    suppress = True  # Keep the higher priority one (person)
            # Vehicle type conflicts - prevent bike/motorcycle vs car confusion
            elif {lb, lp} == {"bicycle", "car"} or {lb, lp} == {"bike", "car"}:
                if iou >= 0.4:  # Bike vs car - choose based on confidence and size
                    conf_b = float(best.get('confidence', 0)); conf_p = float(p.get('confidence', 0))
                    # If confidence difference is significant, keep higher confidence
                    if abs(conf_b - conf_p) > 0.15:
                        suppress = True if conf_b > conf_p else False
                    else:
                        suppress = True  # Default: keep bicycle (smaller, more specific)
            elif {lb, lp} == {"motorcycle", "car"} or {lb, lp} == {"motorbike", "car"}:
                if iou >= 0.4:  # Motorcycle vs car
                    conf_b = float(best.get('confidence', 0)); conf_p = float(p.get('confidence', 0))
                    if abs(conf_b - conf_p) > 0.15:
                        suppress = True if conf_b > conf_p else False
                    else:
                        suppress = True  # Default: keep motorcycle (more specific)
            elif {lb, lp} == {"bicycle", "motorcycle"} or {lb, lp} == {"bike", "motorbike"}:
                if iou >= 0.3:  # Bike vs motorcycle - choose based on confidence
                    conf_b = float(best.get('confidence', 0)); conf_p = float(p.get('confidence', 0))
                    suppress = True if conf_b > conf_p else False
            # Knife vs Gun conflicts - choose based on confidence and specificity
            elif "knife" in {lb, lp} and any(k in {lb, lp} for k in ["gun", "pistol", "rifle", "firearm"]):
                if iou >= 0.3:  # Knife vs gun overlap
                    conf_b = float(best.get('confidence', 0)); conf_p = float(p.get('confidence', 0))
                    # If confidence difference is significant (>20%), choose higher confidence
                    if abs(conf_b - conf_p) > 0.20:
                        suppress = True if conf_b > conf_p else False
                    else:
                        # Similar confidence - prefer the more specific/accurate detection
                        # Based on weapon type characteristics
                        suppress = True  # Keep the first detected (higher priority)
            # Any person vs any vehicle type
            elif lb == "person" and lp in VEHICLE_LABELS and iou >= 0.25:
                suppress = True  # Keep person
            elif lp == "person" and lb in VEHICLE_LABELS and iou >= 0.25:
                suppress = False  # Will keep person (p), so don't add this vehicle to remain
                continue
            # Weapon priority - weapons suppress everything else at lower IoU
            elif "weapon" in {mb, mp}:
                if iou >= 0.4:
                    suppress = True
            # Same macro category (e.g., two different vehicles)
            elif mb == mp and mb != "other" and iou >= 0.4:
                suppress = True
            # General high overlap
            elif iou >= iou_thresh:
                suppress = True
                
            if not suppress:
                remain.append(p)
        items = remain
    return kept


def annotate_image(image_path: str, output_path: str) -> str:
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    combined_predictions = []

# Roboflow detections (multi-key, multi-model)
    if HAS_ROBOFLOW:
        try:
            keys = [s.strip() for s in os.getenv("ROBOFLOW_KEYS", "").split(",") if s.strip()]
            models = [s.strip() for s in os.getenv("ROBOFLOW_MODELS", "").split(",") if s.strip()]
            api_key_single = os.getenv("ROBOFLOW_API_KEY", "")
            model_single = os.getenv("ROBOFLOW_MODEL_ID", "")
            if not keys:
                keys = [api_key_single or DEFAULT_API_KEY]
            if not models:
                models = [s.strip() for s in (model_single.split(",") if model_single else []) if s.strip()]
            if not models:
                models = list(DEFAULT_MODELS)
            for key in keys:
                client = InferenceHTTPClient(api_url="https://serverless.roboflow.com", api_key=key)
                for model_id in models:
                    sep = '&' if '?' in model_id else '?'
                    model_with_params = f"{model_id}{sep}confidence={API_CONFIDENCE}&overlap={API_OVERLAP}"
                    rf_result = client.infer(img, model_id=model_with_params)
                    if isinstance(rf_result, dict) and "predictions" in rf_result:
                        for p in rf_result["predictions"]:
                            q = dict(p)
                            q["source"] = "rf"
                            combined_predictions.append(q)
        except Exception as e:
            print(f"Roboflow Error: {e}")
    else:
        print("Roboflow SDK not available; skipping Roboflow detections.")

    # Add local YOLO general detections (person, car, etc.)
    try:
        model = YOLO("yolov8s.pt")
        # Use lower confidence for small images to catch more detections
        conf_threshold = 0.1 if img.shape[0] * img.shape[1] < 100000 else 0.25
        results = model.predict(source=img, verbose=False, conf=conf_threshold)
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            label = results[0].names[class_id]
            
            # For small images, try to remap misclassified objects to weapons if they look like weapons
            if img.shape[0] * img.shape[1] < 100000:  # Small image
                # Check if detected object might be a weapon based on shape and context
                width = x2 - x1
                height = y2 - y1
                aspect_ratio = width / height if height > 0 else 1.0
                
                # If YOLO detects airplane/boat in small image, it might be a rifle
                if label.lower() in ['airplane', 'boat', 'surfboard'] and aspect_ratio > 2.0:
                    # Long thin objects in weapon-context images are likely rifles
                    label = 'rifle'
                    # Boost confidence for likely weapon detections
                    confidence = min(0.6, confidence * 3.0)
            
            combined_predictions.append({
                "x": (x1 + x2) / 2,
                "y": (y1 + y2) / 2,
                "width": x2 - x1,
                "height": y2 - y1,
                "confidence": confidence,
                "class": label,
                "source": "local",
            })
    except Exception as e:
        print(f"Local YOLO Error: {e}")

    # Suppress local predictions that overlap weapon detections from Roboflow
    def _to_xyxy(p):
        x = int(p.get("x", 0)); y = int(p.get("y", 0)); w = int(p.get("width", 0)); h = int(p.get("height", 0))
        return (x - w // 2, y - h // 2, x + w // 2, y + h // 2)

    # Get all weapon detections (from any source)
    all_weapons = [p for p in combined_predictions if _is_weapon(p.get("class"))]
    rf_weapons = [p for p in combined_predictions if p.get("source") == "rf" and _is_weapon(p.get("class"))]
    ALWAYS_KEEP = {"cell phone","phone","mobile","smartphone","cellphone"}

    def _area_xyxy(b):
        x1, y1, x2, y2 = b
        return max(0, x2 - x1) * max(0, y2 - y1)

    def _center_in(b, cx, cy):
        x1, y1, x2, y2 = b
        return (cx >= x1 and cx <= x2 and cy >= y1 and cy <= y2)

    filtered_after_overlap = []
    for p in combined_predictions:
        cls = str(p.get("class","")).lower()
        
        # Always keep weapons with high confidence
        if _is_weapon(cls):
            filtered_after_overlap.append(p)
            continue
            
        # For non-weapon detections, check against ALL weapons (not just RF)
        if p.get("source") == "local":
            if cls in ALWAYS_KEEP:
                # Even ALWAYS_KEEP items should be filtered if they strongly overlap with weapons
                keep = True
                b_local = _to_xyxy(p)
                cx, cy = int(p.get("x", 0)), int(p.get("y", 0))
                for w_p in all_weapons:
                    b_weapon = _to_xyxy(w_p)
                    # Stricter filtering: if local detection overlaps significantly with any weapon
                    if _xyxy_iou(b_local, b_weapon) >= 0.4 or _center_in(b_weapon, cx, cy):
                        keep = False
                        break
                if keep:
                    filtered_after_overlap.append(p)
                continue
            
            # Temporarily disable weapon overlap filtering for better general detection
            # This helps detect more cars, buses, motorcycles etc.
            keep = True  # Keep all local detections for now
        else:
            # Temporarily disable RF overlap filtering for maximum detection
            # Keep all RF detections
            pass
        
        filtered_after_overlap.append(p)

    combined_predictions = filtered_after_overlap

    
    # Canonicalize labels to reduce duplicates across models
    for p in combined_predictions:
        p["class"] = canonical_label(p.get("class"))

    # Apply NMS with balanced suppression
    combined_predictions = _global_nms(combined_predictions, 0.45)
    
    # Post-processing validation for misclassifications
    def _validate_classification(predictions):
        validated = []
        
        # Check if image has strong weapon detections
        weapon_detections = [p for p in predictions if _is_weapon(p.get("class", ""))]
        has_strong_weapons = any(float(p.get("confidence", 0)) > 0.7 for p in weapon_detections)
        
        for pred in predictions:
            label = str(pred.get("class", "")).lower()
            w = int(pred.get("width", 0))
            h = int(pred.get("height", 0))
            aspect_ratio = w / h if h > 0 else 1.0
            conf = float(pred.get("confidence", 0))
            
            # Validate gun vs knife classifications
            if any(k in label for k in ["gun", "pistol", "rifle", "firearm"]):
                if aspect_ratio < 0.5 and w < 200 and w * h < 600:
                    pred["class"] = "knife"
            
            # Validate autorickshaw vs car/taxi classifications
            if label == "autorickshaw":
                # Autorickshaws are typically smaller and more square-like than cars
                # Cars/taxis are usually wider (higher aspect ratio) and larger
                if aspect_ratio > 2.0 or (w > 200 and h > 150 and aspect_ratio > 1.5):
                    # This looks more like a car/taxi than an autorickshaw
                    pred["class"] = "car"
                elif w * h > 20000:  # Very large detection is likely a car, not rickshaw
                    pred["class"] = "car"
            
            # Suppress non-weapon detections in weapon-heavy images (strict)
            if has_strong_weapons and not _is_weapon(label):
                if label == "person":
                    pass  # Always keep person detections
                else:
                    continue  # Drop all non-weapon, non-person when strong weapons are present
            
            # Animal vs person discrimination - animals should have priority over person in ambiguous cases
            # If detected as person but other strong animal indicators exist, prefer animal
            if label == "person":
                # Check if there are animal detections nearby that might be more accurate
                animal_found = False
                for other_pred in predictions:
                    other_label = str(other_pred.get("class", "")).lower()
                    if other_label in ANIMAL_LABELS:
                        # Calculate overlap
                        ox = int(other_pred.get("x", 0))
                        oy = int(other_pred.get("y", 0))
                        px = int(pred.get("x", 0))
                        py = int(pred.get("y", 0))
                        distance = ((ox - px) ** 2 + (oy - py) ** 2) ** 0.5
                        if distance < max(w, h):  # Close proximity suggests same object
                            animal_found = True
                            break
                
                # If animal detection exists nearby and person confidence is not very high, skip person
                if animal_found and conf < 0.7:
                    continue  # Skip this person detection
            
            validated.append(pred)
        return validated
    
    combined_predictions = _validate_classification(combined_predictions)

    def _label_requirements(label: str):
        l = (label or "").lower()
        
        # Adjust thresholds for small images
        is_small_image = img.shape[0] * img.shape[1] < 100000  # Less than 100k pixels
        
        # Very high threshold for false-positive prone items and dangerous misclassifications
        if any(k in l for k in ["theft","mask theft","robber","criminal","bandit","glove","gloves","ied","bomb","explosive","improvised explosive device"]):
            return 0.98, 2000  # Extremely high confidence required for these dangerous false positives
        
        # Balanced threshold for knives - catch real knives but prevent false positives
        if "knife" in l:
            if is_small_image:
                return 0.35, 200  # Lower thresholds for small images
            return 0.55, 400
        
        # Firearms - lower threshold to catch more guns while maintaining accuracy
        if any(k in l for k in ["gun","firearm","pistol","rifle"]):
            if is_small_image:
                return 0.40, 200  # Much lower thresholds for small images
            return 0.75, 400  # Reduced from 0.85, 600
        
        # Other weapons
        if _is_weapon(l):
            if is_small_image:
                return 0.35, 200  # Lower thresholds for small images
            return WEAPON_CONFIDENCE_THRESHOLD, 800
        
        # Class-specific thresholds - balanced for better detection
        if l == "person":
            return 0.25, 200   # Reasonable threshold for person detection
        # Special handling for bikes/motorcycles
        if l in {"bicycle", "bike", "cycle", "motorcycle", "motorbike", "scooter", "moped"}:
            return 0.30, 300   # Standard threshold for bikes/motorcycles
        # Special handling for rickshaws/autorickshaws - more conservative to prevent taxi misclassification
        if l in {"rickshaw", "autorickshaw", "auto rickshaw", "tuk-tuk", "three wheeler", "auto"}:
            return 0.40, 300  # Higher threshold to prevent taxi/car misclassification
        if l in VEHICLE_LABELS:
            return 0.30, 300  # Standard vehicle detection
        if l in ELECTRONICS_LABELS:
            return 0.35, 200  # Electronics threshold
        if l in ANIMAL_LABELS:
            return 0.25, 300  # Animal detection threshold
        # Default - reasonable thresholds
        return 0.25, 200   # Default balanced thresholds

    def _is_non_violence(label: str) -> bool:
        l = (label or "").lower()
        if l in NON_VIOLENCE_LABELS:
            return True
        return any(k in l for k in ["non-violence","non violence","peace","peaceful","nonviolence"])

    def _is_false_positive_accessory(label: str) -> bool:
        l = (label or "").lower()
        # Check for false positive accessories and dangerous misclassifications
        if l in FALSE_POSITIVE_LABELS:
            return True
        return any(k in l for k in ["theft mask","mask theft","robber","criminal mask","bandit","glove","gloves","ied","bomb","explosive"])

    # Prepare filtered predictions for JSON and draw annotations
    filtered = []
    label_boxes = []
    
    for i, pred in enumerate(combined_predictions):
        conf = float(pred.get("confidence", 0))
        x = int(pred.get("x", 0))
        y = int(pred.get("y", 0))
        w = int(pred.get("width", 0))
        h = int(pred.get("height", 0))
        label = canonical_label(str(pred.get("class", "obj")))
        
        if _is_non_violence(label):
            continue
        if _is_false_positive_accessory(label):
            continue  # Skip theft mask and similar false positives
        
        # Skip detections that might be too small or too large relative to image
        image_area = img.shape[0] * img.shape[1] if img is not None else 1
        detection_area = w * h
        
        # Skip very small detections (noise)
        if detection_area < image_area * 0.001:  # Less than 0.1% of image
            continue
        
        # Skip very large detections (likely false positives covering entire image)
        if detection_area > image_area * 0.8:  # More than 80% of image
            continue
            
        # Class-specific thresholds and min areas
        req, min_area = _label_requirements(label)
        if conf < req:
            continue
        if (w * h) < min_area:
            continue
        filtered.append({
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "confidence": conf,
            "class": label,
        })
        x1 = x - w // 2
        y1 = y - h // 2
        x2 = x + w // 2
        y2 = y + h // 2
        # Draw weapons in red, others in green
        color = (0, 0, 255) if _is_weapon(label) else (0, 255, 0)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        _draw_label_clamped(img, x1, y1, f"{label}: {conf:.2f}", color, label_boxes)

    # Update single JSON file with this image's predictions
    try:
        data = {}
        if Path(ANNOTATIONS_JSON).exists():
            with open(ANNOTATIONS_JSON, "r", encoding="utf-8") as f:
                data = json.load(f) or {}
        data[Path(image_path).name] = filtered
        with open(ANNOTATIONS_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Annotation JSON write error: {e}")

    cv2.imwrite(output_path, img)
    return output_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python detect_image.py <image_path>")
        sys.exit(2)
    in_path = sys.argv[1]
    in_path = str(Path(in_path))
    stem = Path(in_path).stem
    out_path = str(Path(in_path).with_name(f"{stem}_annotated.jpg"))

    saved = annotate_image(in_path, out_path)
    print(f"SAVED: {saved}")


if __name__ == "__main__":
    main()
