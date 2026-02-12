# Roboflow Integration Summary

## ✅ Implementation Complete

The system now **prioritizes Roboflow API** as the primary detection service with automatic YOLOv8 fallback.

---

## 🎯 Priority System

### Detection Order:
1. **Roboflow API** (Priority 1) - If `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ENDPOINT` are configured
2. **YOLOv8 Local** (Fallback) - If Roboflow is not configured

### How It Works:
```python
# On startup, the system checks:
def __init__(self):
    # Try Roboflow first
    roboflow_service = create_roboflow_service()
    if roboflow_service is not None:
        self.service = roboflow_service  # ✅ Use Roboflow
        self.mode = "roboflow"
    else:
        self.service = AIDetectionService()  # ⚠️ Fallback to YOLOv8
        self.mode = "yolov8"
```

---

## 📁 Files Created/Modified

### New Files:
1. ✅ `backend/services/roboflow_service.py` - Roboflow API integration
2. ✅ `backend/services/detection_service.py` - Unified service with priority logic
3. ✅ `docs/AI_DETECTION_SETUP.md` - Complete setup guide
4. ✅ `docs/DETECTION_PRIORITY.md` - Quick priority reference
5. ✅ `docs/ROBOFLOW_INTEGRATION.md` - This file

### Modified Files:
1. ✅ `backend/core/config.py` - Added Roboflow settings
2. ✅ `.env.example` - Added Roboflow configuration with priority notes

---

## 🔧 Configuration

### To Use Roboflow (Auto-detected as Priority 1):
```env
# .env file
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_MODEL_ENDPOINT=workspace-name/model-name/version

# Example:
ROBOFLOW_API_KEY=rf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ROBOFLOW_MODEL_ENDPOINT=security-systems/weapon-detection/3
```

### To Use YOLOv8 (Auto-fallback):
```env
# .env file
# Simply leave Roboflow settings empty
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ENDPOINT=

# Ensure YOLOv8 model exists
MODEL_PATH=ai/models/best.pt
```

---

## 🚀 Quick Start with Roboflow

### Step 1: Get Roboflow Credentials
1. Sign up at [https://app.roboflow.com/](https://app.roboflow.com/)
2. Create or select a project
3. Get API key from [Settings → API](https://app.roboflow.com/settings/api)
4. Note your model endpoint (format: `workspace/model/version`)

### Step 2: Configure
Add to your `.env` file:
```env
ROBOFLOW_API_KEY=rf_your_key_here
ROBOFLOW_MODEL_ENDPOINT=your-workspace/your-model/1
```

### Step 3: Start Server
```bash
python main.py
```

### Step 4: Verify
Check the startup logs:
```
[INFO] Roboflow API configured - using Roboflow detection service (cloud)
[INFO] Detection service initialized in roboflow mode
```

Or query the API:
```bash
curl http://localhost:8000/api/v1/detection/info
```

---

## 📊 Feature Comparison

| Feature | Roboflow API | YOLOv8 Local |
|---------|--------------|--------------|
| **Priority** | ⭐ 1st (if configured) | 🔄 Fallback |
| **Setup Time** | ~5 minutes | ~30-60 minutes |
| **Model Hosting** | Cloud (managed) | Local (self-hosted) |
| **Training** | Web UI | CLI/Code |
| **Cost** | Per inference | One-time GPU cost |
| **Speed (Image)** | 200-500ms | 10-50ms |
| **Speed (Video)** | Slow (API calls) | Fast (local) |
| **Offline** | ❌ No | ✅ Yes |
| **GPU Required** | ❌ No | Recommended |
| **Scalability** | API quota | Hardware limit |

---

## 🔍 Detection Service Features

Both services provide:
- ✅ Image detection
- ✅ Video detection (frame-by-frame)
- ✅ Bounding box annotations
- ✅ Threat level classification (dangerous/caution/harmless)
- ✅ Confidence scores
- ✅ Detection summaries
- ✅ Identical API endpoints

---

## 📝 API Endpoints (Same for Both Services)

### Image Detection
```bash
POST /api/v1/detection/image
Content-Type: multipart/form-data

file: <image_file>
```

### Video Detection
```bash
POST /api/v1/detection/video
Content-Type: multipart/form-data

file: <video_file>
```

### Service Info
```bash
GET /api/v1/detection/info

# Returns:
{
  "mode": "roboflow" | "yolov8",
  "service_type": "cloud" | "local",
  "model": "model_path_or_endpoint",
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

---

## 🎨 Roboflow Service Implementation

### Key Features:
1. **Direct API Integration**: Uses Roboflow REST API
2. **Automatic Format Conversion**: Converts Roboflow bbox format (center+size) to corner coordinates
3. **Frame Skipping for Video**: Processes every Nth frame to reduce API costs
4. **Error Handling**: Graceful fallback on API errors
5. **Same Interface**: Drop-in replacement for YOLOv8 service

### Code Structure:
```python
# backend/services/roboflow_service.py
class RoboflowDetectionService:
    - __init__(api_key, model_endpoint)
    - detect_image(image_path) → (detections, annotated_image)
    - detect_video(video_path, output_path) → detections_list
    - get_detection_summary(detections) → summary_dict

# Factory function
create_roboflow_service() → RoboflowDetectionService | None
```

---

## 🔄 Switching Services

### No Restart Needed - Just Configure:

**Enable Roboflow:**
```bash
# Add to .env
echo "ROBOFLOW_API_KEY=rf_xxxxx" >> .env
echo "ROBOFLOW_MODEL_ENDPOINT=workspace/model/1" >> .env

# Restart server
python main.py
```

**Disable Roboflow (Use YOLOv8):**
```bash
# Remove or clear in .env
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ENDPOINT=

# Restart server
python main.py
```

---

## 💰 Cost Considerations

### Roboflow Pricing (as of 2024):
- **Free Tier**: 1,000 predictions/month
- **Starter**: $0.0005 per prediction (~$5 per 10K)
- **Pro**: $0.0003 per prediction (~$3 per 10K)

### Example Scenarios:

**Low Volume (100 images/day)**:
- Monthly predictions: ~3,000
- Roboflow cost: Free tier
- Recommendation: ✅ Use Roboflow

**Medium Volume (1,000 images/day)**:
- Monthly predictions: ~30,000
- Roboflow cost: ~$15-25/month
- Recommendation: ✅ Use Roboflow or YOLOv8

**High Volume (10,000+ images/day)**:
- Monthly predictions: 300,000+
- Roboflow cost: $150-500/month
- Recommendation: ✅ Use YOLOv8 (local)

---

## 🐛 Troubleshooting

### Issue: "Roboflow not configured"
**Cause**: Missing API credentials  
**Solution**: Add `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ENDPOINT` to `.env`

### Issue: "API error: 401 Unauthorized"
**Cause**: Invalid API key  
**Solution**: Verify API key at [Roboflow Settings](https://app.roboflow.com/settings/api)

### Issue: "API error: 404 Not Found"
**Cause**: Invalid model endpoint  
**Solution**: Check endpoint format: `workspace/model/version` (no leading/trailing slashes)

### Issue: "API error: 429 Too Many Requests"
**Cause**: Rate limit exceeded  
**Solution**: Upgrade Roboflow plan or switch to YOLOv8

### Issue: System falls back to YOLOv8 unexpectedly
**Cause**: Roboflow credentials not loaded  
**Solution**: Restart server after updating `.env`

---

## 📚 Documentation

- **[AI_DETECTION_SETUP.md](AI_DETECTION_SETUP.md)** - Complete setup guide for both services
- **[DETECTION_PRIORITY.md](DETECTION_PRIORITY.md)** - Quick reference for priority system
- **[QUICKSTART.md](QUICKSTART.md)** - General project quickstart guide

---

## ✅ Testing

### Test Roboflow Detection:
```bash
# 1. Configure Roboflow in .env
# 2. Start server
python main.py

# 3. Check logs for:
# [INFO] Roboflow API configured - using Roboflow detection service (cloud)

# 4. Test detection
curl -X POST http://localhost:8000/api/v1/detection/image \
  -F "file=@test_image.jpg"
```

### Test YOLOv8 Fallback:
```bash
# 1. Clear Roboflow credentials in .env
# 2. Start server
python main.py

# 3. Check logs for:
# [INFO] Roboflow not configured - using YOLOv8 detection service (local)

# 4. Test detection (same endpoint)
curl -X POST http://localhost:8000/api/v1/detection/image \
  -F "file=@test_image.jpg"
```

---

## 🎉 Summary

✅ **Roboflow is now the first priority**  
✅ **YOLOv8 automatically falls back** if Roboflow is not configured  
✅ **No manual mode switching** required  
✅ **Same API** for both services  
✅ **Clear logging** shows which service is active  
✅ **Easy to switch** by just updating `.env`  

**Start using Roboflow now** by simply adding your API credentials to `.env`!
