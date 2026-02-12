# Detection Service Priority

## 🎯 Auto-Detection Order

The system automatically selects the detection service in this priority order:

```
1. Roboflow API (if configured) ⭐ PRIORITY
   ↓
2. YOLOv8 Local (fallback)
```

---

## How It Works

### ✅ Roboflow is Used When:
```env
ROBOFLOW_API_KEY=rf_xxxxxxxxxxxxx
ROBOFLOW_MODEL_ENDPOINT=workspace/model/version
```
→ **Result**: `[INFO] Roboflow API configured - using Roboflow detection service (cloud)`

### ✅ YOLOv8 is Used When:
```env
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ENDPOINT=
```
→ **Result**: `[INFO] Roboflow not configured - using YOLOv8 detection service (local)`

---

## Quick Configuration

### For Roboflow (Recommended)
1. Get your API key from [https://app.roboflow.com/settings/api](https://app.roboflow.com/settings/api)
2. Add to `.env`:
   ```env
   ROBOFLOW_API_KEY=your_api_key
   ROBOFLOW_MODEL_ENDPOINT=workspace/model/version
   ```
3. Start server: `python main.py`
4. Roboflow will be used automatically! ✨

### For YOLOv8
1. Leave Roboflow settings empty in `.env`
2. Place your model at `ai/models/best.pt`
3. Start server: `python main.py`
4. YOLOv8 will be used automatically! 🚀

---

## Benefits of This Approach

✅ **No manual mode switching** - just configure what you have  
✅ **Roboflow prioritized** - easiest setup for quick start  
✅ **Automatic fallback** - works even if Roboflow is not configured  
✅ **Clear logging** - server tells you which service is active  
✅ **Same API** - endpoints work the same regardless of backend  

---

## Verification

Check which service is active:

```bash
curl http://localhost:8000/api/v1/detection/info
```

Response:
```json
{
  "mode": "roboflow",
  "service_type": "cloud",
  "model": "workspace/model/1",
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

or

```json
{
  "mode": "yolov8",
  "service_type": "local",
  "model": "ai/models/best.pt",
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

---

## Summary

🥇 **First Priority**: Roboflow API (cloud, easy setup)  
🥈 **Fallback**: YOLOv8 (local, fast, offline)  

Just configure Roboflow credentials and the system will use it automatically!
