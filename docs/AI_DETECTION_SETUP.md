# AI Detection Service Setup Guide

This project supports **two detection modes**: YOLOv8 (local) and Roboflow API (cloud).

## 🎯 Auto-Detection Priority

The system **automatically prioritizes Roboflow** and uses the following detection order:

1. **Roboflow API** (if `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ENDPOINT` are configured)
2. **YOLOv8 Local** (fallback if Roboflow is not configured)

You don't need to manually switch modes - just configure the credentials you want to use!

---

## Detection Modes

### 1. Roboflow API (Cloud Detection) - **Priority 1**
- **Pros**: No model hosting, easy to use, automatic updates
- **Cons**: Requires API calls, costs per inference, needs internet
- **Use case**: Quick prototyping, testing, low-volume processing
- **Status**: Used automatically if configured

### 2. YOLOv8 (Local Detection) - **Fallback**
- **Pros**: Fast, offline, no API costs, full control
- **Cons**: Requires local model file, GPU recommended for video
- **Use case**: Production deployments, high-volume processing, offline environments
- **Status**: Used when Roboflow is not configured

---

## Quick Start

### Option A: Use Roboflow (Recommended for Quick Start)
```env
# Just add these two lines to your .env file
ROBOFLOW_API_KEY=your_api_key_here
ROBOFLOW_MODEL_ENDPOINT=workspace/model/version
```

### Option B: Use YOLOv8 (No Configuration Needed)
```env
# Leave Roboflow settings empty - YOLOv8 will be used automatically
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ENDPOINT=
MODEL_PATH=ai/models/best.pt
```

---

## Option 1: YOLOv8 Setup (Local)

### Step 1: Train or Download a Model

#### Option A: Use Pre-trained COCO Model
```bash
# Download YOLOv8 pre-trained model
pip install ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

#### Option B: Train Custom Model
```bash
# Prepare your dataset in YOLO format
# Train the model
yolo task=detect mode=train model=yolov8n.pt data=data.yaml epochs=100 imgsz=640
```

#### Option C: Use Roboflow to Export YOLOv8 Model
1. Go to [Roboflow](https://roboflow.com/)
2. Upload your dataset
3. Label and augment your images
4. Export in **YOLOv8** format
5. Download and extract to `ai/models/`

### Step 2: Configure Model Path

Place your model file in `ai/models/` directory:
```
ai/
└── models/
    └── best.pt  # Your trained model
```

Update `.env`:
```env
MODEL_MODE=yolov8
MODEL_PATH=ai/models/best.pt
CONFIDENCE_THRESHOLD=0.25
IOU_THRESHOLD=0.45
DEVICE=cpu  # or 'cuda' for GPU
```

### Step 3: Test YOLOv8 Detection

```bash
# Start the server
python main.py

# Test with curl
curl -X POST http://localhost:8000/api/v1/detection/image \
  -F "file=@test_image.jpg"
```

---

## Option 2: Roboflow API Setup (Cloud)

### Step 1: Create Roboflow Account

1. Go to [https://app.roboflow.com/](https://app.roboflow.com/)
2. Sign up for a free account
3. Create a new workspace and project

### Step 2: Train or Use a Model

#### Option A: Use Public Model
- Browse the [Roboflow Universe](https://universe.roboflow.com/)
- Find a pre-trained model (e.g., weapon detection, PPE detection)
- Note the model endpoint

#### Option B: Train Your Own
1. Upload images to Roboflow
2. Annotate objects
3. Generate dataset with augmentations
4. Train model (click "Train" → "Deploy")
5. Get your model endpoint (format: `workspace/model-name/version`)

### Step 3: Get API Key

1. Go to [Roboflow Settings](https://app.roboflow.com/settings/api)
2. Copy your **Private API Key**
3. Keep it secure (never commit to git)

### Step 4: Configure Roboflow

Update `.env`:
```env
MODEL_MODE=roboflow
ROBOFLOW_API_KEY=your_api_key_here
ROBOFLOW_MODEL_ENDPOINT=workspace-name/model-name/1
CONFIDENCE_THRESHOLD=0.25
```

Example endpoint: `security-detection/weapon-detector/3`

### Step 5: Test Roboflow Detection

```bash
# Start the server
python main.py

# Test with curl
curl -X POST http://localhost:8000/api/v1/detection/image \
  -F "file=@test_image.jpg"
```

---

## Comparison: YOLOv8 vs Roboflow

| Feature | YOLOv8 (Local) | Roboflow API (Cloud) |
|---------|----------------|----------------------|
| **Setup Complexity** | Medium | Easy |
| **Speed (Image)** | Fast (10-50ms) | Moderate (200-500ms) |
| **Speed (Video)** | Fast | Slow (many API calls) |
| **Cost** | Free (after GPU) | Pay per inference |
| **Offline Support** | ✅ Yes | ❌ No |
| **GPU Required** | Recommended | Not needed |
| **Model Hosting** | Local | Roboflow servers |
| **Custom Training** | Full control | Roboflow UI |
| **Scalability** | Limited by hardware | Limited by API quota |

---

## Switching Between Modes

The system automatically detects which service to use based on your configuration:

### Switch to Roboflow (Priority 1)
```env
# Add Roboflow credentials - will be used automatically
ROBOFLOW_API_KEY=your_api_key
ROBOFLOW_MODEL_ENDPOINT=workspace/model/version
```

### Switch to YOLOv8 (Fallback)
```env
# Remove or leave empty Roboflow credentials
ROBOFLOW_API_KEY=
ROBOFLOW_MODEL_ENDPOINT=
```

Restart the server after changing:
```bash
# Stop server (Ctrl+C)
# Restart
python main.py
```

The server will log which service it's using:
```
[INFO] Roboflow API configured - using Roboflow detection service (cloud)
```
or
```
[INFO] Roboflow not configured - using YOLOv8 detection service (local)
```

---

## API Endpoints

Both modes use the same API endpoints:

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

### Get Service Info
```bash
GET /api/v1/detection/info

Response:
{
  "mode": "yolov8",
  "service_type": "local",
  "model": "ai/models/best.pt",
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

---

## Threat Detection

Both services use the same threat classification:

### Dangerous Objects (Red)
- gun, pistol, rifle, knife, grenade
- explosive, bomb, weapon, firearm

### Caution Objects (Yellow)
- person, suspicious_object

### Harmless Objects (Green)
- All other detected objects

Configure custom threat levels in `backend/core/config.py`:
```python
DANGEROUS_CLASSES = [
    "gun", "pistol", "rifle", "knife", "grenade"
]

CAUTION_CLASSES = [
    "person", "suspicious_object"
]
```

---

## Performance Tuning

### YOLOv8 Performance

```env
# For faster inference (lower accuracy)
MODEL_PATH=ai/models/yolov8n.pt  # nano model
CONFIDENCE_THRESHOLD=0.5

# For better accuracy (slower)
MODEL_PATH=ai/models/yolov8x.pt  # extra-large model
CONFIDENCE_THRESHOLD=0.25

# Enable GPU acceleration
DEVICE=cuda
```

### Roboflow Performance

```env
# Higher confidence = fewer false positives
CONFIDENCE_THRESHOLD=0.5

# Lower confidence = more detections
CONFIDENCE_THRESHOLD=0.2
```

---

## Troubleshooting

### YOLOv8 Issues

**Model not found:**
```bash
FileNotFoundError: Model not found at ai/models/best.pt
```
Solution: Download or train a model and place it in `ai/models/`

**Out of memory:**
```bash
RuntimeError: CUDA out of memory
```
Solution: Use smaller model (yolov8n.pt) or switch to CPU

### Roboflow Issues

**API key not working:**
```bash
AttributeError: 'Settings' object has no attribute 'ROBOFLOW_API_KEY'
```
Solution: Add `ROBOFLOW_API_KEY` to `.env`

**API quota exceeded:**
```bash
429 Too Many Requests
```
Solution: Upgrade Roboflow plan or switch to YOLOv8

**Invalid endpoint:**
```bash
404 Model not found
```
Solution: Check model endpoint format (workspace/model/version)

---

## Recommended Setup

### For Development:
- **Mode**: Roboflow (easy setup, no model needed)
- **Confidence**: 0.25
- **Use case**: Quick testing and prototyping

### For Production:
- **Mode**: YOLOv8 (fast, offline, no API costs)
- **Model**: Custom trained on your data
- **Device**: CUDA (GPU)
- **Confidence**: 0.4-0.6
- **Use case**: Real-time detection, high volume

---

## Cost Analysis

### YOLOv8 (One-time costs)
- GPU Instance: $0-50/month (if cloud-hosted)
- Training: Free (DIY) or $100-500 (third-party)
- Inference: Free (unlimited)

### Roboflow API (Per-inference costs)
- Free Tier: 1,000 inferences/month
- Starter: $0.0005 per inference (10,000 = $5)
- Pro: $0.0003 per inference
- Hosted Training: Included

**Example**: Processing 10,000 images/month
- YOLOv8: $0-50/month (hosting)
- Roboflow: $5+/month (API calls)

---

## Next Steps

1. Choose your detection mode (YOLOv8 or Roboflow)
2. Configure `.env` with appropriate settings
3. Test with sample images/videos
4. Integrate into your application
5. Monitor performance and costs
6. Scale as needed

For questions, see [QUICKSTART.md](QUICKSTART.md) or [README.md](../README.md)
