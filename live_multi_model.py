# live_multi_model.py

import cv2
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from inference_sdk import InferenceHTTPClient

# --- Configuration ---
import os
DEFAULT_API_KEY = "RiAH9d9sVrQjjXrULxl5"
DEFAULT_MODELS = ["animal-detection-ofnht/1", "person-voffo/3", "theft-detection-2jc5t/9", "logistics-sz9jr/2", "car-detection-yd6mb/1", "gundetection-ydunq/2", "human-az20v/4", "guns-30vbz/2", "guns-dataset-1ggvd/1", "animals-cq6th/3", "premade-gduc5/3"]
CONFIDENCE_THRESHOLD = 0.40
WEAPON_CONFIDENCE_THRESHOLD = 0.75
MIN_BOX_AREA = 1200  # pixels^2
API_CONFIDENCE = 0.30  # lower to allow multiple instances
API_OVERLAP = 10       # lower NMS IoU to avoid merging
# Performance tuning for live webcam (all models enabled)
FRAME_SHORT_SIDE_TARGET = 480     # downscale frames more aggressively for speed
INFERENCE_MIN_INTERVAL = 0.0      # 0 = run as fast as responses come back (no extra delay)
WEAPON_LABELS = {"gun","pistol","rifle","firearm","weapon","knife","grenade","rocket launcher","rocket","launcher","rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine","sword","machete","bomb","explosive"}
NON_VIOLENCE_LABELS = {"non violence","non-violence","non_violence","nonviolence","no violence","peace","peaceful"}
# --------------------

# Canonicalization and helper sets
CANON_KEYWORDS = [
    ("person", ["person", "human"]),
    ("car", ["car", "automobile"]),
    ("motorcycle", ["motorbike", "motorcycle"]),
    ("vehicle", ["vehicle"]),
    ("cell phone", ["cell phone","cellphone","mobile","smartphone","phone"]),
    ("grenade", ["grenade","hand grenade"]),
    ("glove", ["glove","gloves","hand glove"]),
    ("gun", ["gun","handgun","pistol","revolver","firearm"]),
    ("knife", ["knife","knives"]),
]
ANIMAL_LABELS = {"giraffe","zebra","deer","elephant","lion","tiger","bear","horse","cow","dog","cat","wolf","fox","monkey","gorilla","leopard","cheetah","antelope","goat","sheep","camel","buffalo"}
VEHICLE_LABELS = {"car","truck","bus","bicycle","motorcycle","motorbike","vehicle"}
ELECTRONICS_LABELS = {"cell phone","phone","mobile","smartphone","cellphone"}
APPAREL_LABELS = {"glove"}
WEAPON_KEYWORDS = [
    "gun","pistol","rifle","firearm","weapon","knife","grenade","rocket","launcher",
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


def _class_priority(label: str) -> int:
    l = (label or "").lower()
    # Weapons highest, then electronics (phones), then person, then vehicles, then animals, then others
    if (l in WEAPON_LABELS) or any(k in l for k in WEAPON_KEYWORDS):
        return 5
    if l in ELECTRONICS_LABELS:
        return 4
    if l == "person":
        return 3
    if l in VEHICLE_LABELS:
        return 2
    if l in ANIMAL_LABELS:
        return 1
    return 0


def _macro(label: str) -> str:
    l = (label or "").lower()
    if (l in WEAPON_LABELS) or any(k in l for k in WEAPON_KEYWORDS):
        return "weapon"
    if l in ELECTRONICS_LABELS:
        return "electronics"
    if l in APPAREL_LABELS:
        return "apparel"
    if l == "person":
        return "person"
    if l in VEHICLE_LABELS:
        return "vehicle"
    if l in ANIMAL_LABELS:
        return "animal"
    return "other"


def _global_nms(preds, iou_thresh=0.5):
    items = list(preds)
    items.sort(key=lambda p: (_class_priority(p.get('class')), float(p.get('confidence', 0))), reverse=True)
    kept = []
    def to_xyxy(p):
        x = int(p.get('x', 0)); y = int(p.get('y', 0)); w = int(p.get('width', 0)); h = int(p.get('height', 0))
        return (x - w // 2, y - h // 2, x + w // 2, y + h // 2)
    while items:
        best = items.pop(0)
        bxyxy = to_xyxy(best)
        kept.append(best)
        remain = []
        for p in items:
            iou = _xyxy_iou(bxyxy, to_xyxy(p))
            if iou >= iou_thresh:
                lb = str(best.get('class','')).lower(); lp = str(p.get('class','')).lower()
                mb = _macro(lb); mp = _macro(lp)
                suppress = False
                if lb == lp:
                    suppress = True
                elif "electronics" in {mb, mp} and ("weapon" in {mb, mp} or "animal" in {mb, mp}):
                    conf_b = float(best.get('confidence', 0)); conf_p = float(p.get('confidence', 0))
                    suppress = not ("weapon" in {mb, mp} and conf_p >= conf_b + 0.2)
                elif {mb, mp} == {"person","vehicle"}:
                    suppress = True if mb == "person" else False
                elif {mb, mp} == {"person","animal"}:
                    suppress = True if mb == "person" else False
                elif "weapon" in {mb, mp}:
                    suppress = True
                elif iou >= 0.7:
                    suppress = True
                if suppress:
                    continue
            remain.append(p)
        items = remain
    return kept


def _rect_overlap(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 <= bx1 or bx2 <= ax1 or ay2 <= by1 or by2 <= ay1)


def _draw_label_clamped(img, x1, y1, label_text, color, placed):
    h, w = img.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    # Dynamic text sizing based on image dimensions
    short_side = min(h, w)
    if short_side < 600:
        font_scale = 0.5
        thickness = 1
    elif short_side > 1200:
        font_scale = 0.8
        thickness = 2
    else:
        font_scale = 0.7
        thickness = 2
    (tw, th), base = cv2.getTextSize(label_text, font, font_scale, thickness)

    candidates = []
    tx = max(0, min(x1, w - tw - 1))
    ty = y1 - 5
    if ty >= th + 2:
        candidates.append((tx, ty))
    ty2 = min(h - 2, y1 + th + 5)
    candidates.append((tx, ty2))
    tx3 = max(0, min(x1 - tw // 2, w - tw - 1))
    candidates.append((tx3, ty if ty >= th + 2 else ty2))

    for cx, cy in candidates:
        rect = (cx, cy - th, cx + tw, cy)
        ok = True
        for pr in placed:
            if _rect_overlap(rect, pr):
                ok = False
                break
        if ok and rect[0] >= 0 and rect[1] >= 0 and rect[2] <= w and rect[3] <= h:
            cv2.putText(img, label_text, (cx, cy), font, font_scale, color, 2, cv2.LINE_AA)
            placed.append(rect)
            return

    cx = max(0, min(x1, w - tw - 1))
    cy = min(h - 2, y1 + th + 5)
    rect = (cx, cy - th, cx + tw, cy)
    cv2.putText(img, label_text, (cx, cy), font, font_scale, color, 2, cv2.LINE_AA)
    placed.append(rect)

# Shared variables for threads
latest_frame = None
latest_predictions = []
lock = threading.Lock()
is_running = True

# Background Thread for running Roboflow model only
def run_inference():
    global latest_frame, latest_predictions, is_running

    # Prepare Roboflow clients (multi-key) and models (multi-model)
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

    # Prefer person model first for fast initial detection, but keep all models enabled
    models = sorted(models, key=lambda m: 0 if 'person-voffo' in m else 1)

    clients = [InferenceHTTPClient(api_url="https://serverless.roboflow.com", api_key=k) for k in keys]

    loop_idx = 0
    last_inference_time = 0.0
    while is_running:
        frame_to_process = None
        with lock:
            if latest_frame is not None:
                frame_to_process = latest_frame.copy()

        # Optional throttle (kept for safety if INFERENCE_MIN_INTERVAL > 0)
        now = time.time()
        if INFERENCE_MIN_INTERVAL > 0 and (now - last_inference_time) < INFERENCE_MIN_INTERVAL:
            time.sleep(0.01)
            loop_idx += 1
            continue

        if frame_to_process is not None:
            h, w = frame_to_process.shape[:2]
            short_side = min(h, w)
            scale = 1.0
            if short_side > FRAME_SHORT_SIDE_TARGET:
                scale = float(FRAME_SHORT_SIDE_TARGET) / float(short_side)
                new_w, new_h = int(w * scale), int(h * scale)
                frame_in = cv2.resize(frame_to_process, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
            else:
                frame_in = frame_to_process
                new_h, new_w = h, w
            fx = float(new_w) / float(w)
            fy = float(new_h) / float(h)

            combined_predictions = []

            # --- Roboflow inferences (person first for fast response) ---
            try:
                # Run all (client, model) pairs in parallel for faster responses
                tasks = []
                with ThreadPoolExecutor(max_workers=len(clients) * max(1, len(models))) as executor:
                    for client in clients:
                        for model_id in models:
                            sep = '&' if '?' in model_id else '?'
                            model_with_params = f"{model_id}{sep}confidence={API_CONFIDENCE}&overlap={API_OVERLAP}"
                            tasks.append(executor.submit(client.infer, frame_in, model_id=model_with_params))

                    for future in as_completed(tasks):
                        result_rf = future.result()
                        if 'predictions' in result_rf:
                            for p in result_rf['predictions']:
                                q = dict(p)
                                # scale back to original frame size
                                q['x'] = float(q.get('x', 0)) / (fx if fx else 1.0)
                                q['y'] = float(q.get('y', 0)) / (fy if fy else 1.0)
                                q['width'] = float(q.get('width', 0)) / (fx if fx else 1.0)
                                q['height'] = float(q.get('height', 0)) / (fy if fy else 1.0)
                                combined_predictions.append(q)

                # Quick publish path for responsiveness using a subset of strong predictions
                quick = []
                for p in combined_predictions:
                    p['class'] = canonical_label(p.get('class'))
                    label = str(p.get('class','')).lower()
                    if (label in NON_VIOLENCE_LABELS) or ("non-violence" in label) or ("non violence" in label) or ("peace" in label):
                        continue
                    conf = float(p.get('confidence', 0))
                    ww = int(p.get('width', 0)); hh = int(p.get('height', 0))
                    if "knife" in label:
                        req_conf, min_area = 0.45, 300
                    elif any(k in label for k in ["gun","firearm","pistol","rifle"]):
                        req_conf, min_area = 0.85, 600
                    elif (label in WEAPON_LABELS):
                        req_conf, min_area = WEAPON_CONFIDENCE_THRESHOLD, 800
                    elif label in ELECTRONICS_LABELS:
                        # Make phones easier to detect (smaller + slightly lower conf)
                        req_conf, min_area = 0.30, 150
                    else:
                        req_conf, min_area = CONFIDENCE_THRESHOLD, MIN_BOX_AREA
                    if conf >= req_conf and (ww*hh) >= min_area:
                        quick.append(p)
                with lock:
                    latest_predictions = _global_nms(quick, 0.5)

                # Full filtered publish (same criteria but over all predictions)
                filtered = []
                for p in combined_predictions:
                    p['class'] = canonical_label(p.get('class'))
                    label = str(p.get('class','')).lower()
                    if (label in NON_VIOLENCE_LABELS) or ("non-violence" in label) or ("non violence" in label) or ("peace" in label):
                        continue
                    conf = float(p.get('confidence', 0))
                    ww = int(p.get('width', 0)); hh = int(p.get('height', 0))
                    if "knife" in label:
                        req_conf, min_area = 0.45, 300
                    elif any(k in label for k in ["gun","firearm","pistol","rifle"]):
                        req_conf, min_area = 0.85, 600
                    elif (label in WEAPON_LABELS):
                        req_conf, min_area = WEAPON_CONFIDENCE_THRESHOLD, 800
                    elif label in ELECTRONICS_LABELS:
                        req_conf, min_area = 0.30, 150
                    else:
                        req_conf, min_area = CONFIDENCE_THRESHOLD, MIN_BOX_AREA
                    if conf < req_conf or (ww*hh) < min_area:
                        continue
                    filtered.append(p)
                with lock:
                    latest_predictions = _global_nms(filtered, 0.5)

            except Exception as e:
                print(f"Roboflow Error: {e}")

        last_inference_time = now
        loop_idx += 1
        time.sleep(0.05)

# --- Main Program (This part is mostly the same) ---
inference_thread = threading.Thread(target=run_inference)
inference_thread.start()

cap = cv2.VideoCapture(0)
print("Roboflow detection is live. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    with lock:
        latest_frame = frame
        current_predictions = latest_predictions

    # Draw boxes from the combined prediction list
    label_boxes = []
    for prediction in current_predictions:
        confidence = float(prediction['confidence'])
        # Drawing logic is the same as before
        x = int(prediction['x'])
        y = int(prediction['y'])
        width = int(prediction['width'])
        height = int(prediction['height'])
        label = str(prediction['class'])
        l_lower = label.lower()
        if (l_lower in NON_VIOLENCE_LABELS) or ("non-violence" in l_lower) or ("non violence" in l_lower) or ("peace" in l_lower):
            continue
        # Stricter thresholds by class type
        keywords = ["gun","pistol","rifle","firearm","weapon","knife","grenade","rocket","launcher","rpg","bazooka","shotgun","revolver","handgun","sniper","smg","ak","m4","carbine","sword","machete","bomb","explosive"]
        is_weapon = (l_lower in WEAPON_LABELS) or any(k in l_lower for k in keywords)
        if is_weapon:
            req_conf, min_area = WEAPON_CONFIDENCE_THRESHOLD, MIN_BOX_AREA
        elif l_lower in ELECTRONICS_LABELS:
            # Easier to show phones in hand
            req_conf, min_area = 0.30, 150
        else:
            req_conf, min_area = CONFIDENCE_THRESHOLD, MIN_BOX_AREA
        if confidence < req_conf:
            continue
        # Filter tiny boxes
        if (width * height) < min_area:
            continue
        x1 = x - width // 2
        y1 = y - height // 2
        x2 = x + width // 2
        y2 = y + height // 2
        
        # Draw red for weapons, green otherwise
        color = (0, 0, 255) if is_weapon else (0, 255, 0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        _draw_label_clamped(frame, x1, y1, f"{label}: {confidence:.2f}", color, label_boxes)

    cv2.imshow('Multi-Model Security Feed', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up
is_running = False
inference_thread.join()
cap.release()
cv2.destroyAllWindows()
print("Program stopped.")