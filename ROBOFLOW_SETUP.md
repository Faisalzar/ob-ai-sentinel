# 🔧 Roboflow API Setup Guide

## ⚠️ **Current Issue**

Your system is using YOLOv8 instead of Roboflow API, which is why:
- ❌ Gun is detected as "cell phone"
- ❌ Less accurate detections

After configuring Roboflow:
- ✅ Accurate weapon detection
- ✅ Better person detection
- ✅ Cloud-based processing

---

## 📋 **How to Get Roboflow API Credentials**

### **Step 1: Login to Roboflow**

Go to: https://app.roboflow.com/

---

### **Step 2: Get Your API Key**

1. Click on your **profile/account icon** (top right)
2. Go to **Settings** or **Account**
3. Find **API Keys** section
4. Copy your **Private API Key**

**It looks like:** `abcd1234efgh5678ijkl9012mnop3456`

---

### **Step 3: Get Your Model Endpoint**

1. Go to your **Project** in Roboflow
2. Click on your trained **Model**
3. Go to **Deploy** tab
4. Select **API** option
5. You'll see the endpoint format

**Format:** `workspace-name/model-name/version`

**Example:** `faisal-workspace/weapon-detection/3`

---

## 🔑 **Configure in .env File**

Open your `.env` file and replace these values:

```env
# Roboflow API Configuration
ROBOFLOW_API_KEY=your_actual_api_key_here
ROBOFLOW_MODEL_ENDPOINT=your-workspace/your-model/version
```

**Real Example:**
```env
ROBOFLOW_API_KEY=abcd1234efgh5678ijkl9012mnop3456
ROBOFLOW_MODEL_ENDPOINT=faisal-workspace/weapon-detection/3
```

---

## 🔄 **Quick Configuration Commands**

If you provide your credentials, I can update it directly!

### **Option 1: Manual Update**

1. Open `.env` file
2. Find these lines:
```env
ROBOFLOW_API_KEY=YOUR_ROBOFLOW_API_KEY
ROBOFLOW_MODEL_ENDPOINT=YOUR_MODEL_ENDPOINT
```

3. Replace with your actual values:
```env
ROBOFLOW_API_KEY=your_key_here
ROBOFLOW_MODEL_ENDPOINT=your-workspace/your-model/1
```

4. **Save** the file
5. **Restart** the server

---

### **Option 2: PowerShell Command**

Replace the values and run:

```powershell
# Replace YOUR_API_KEY and YOUR_ENDPOINT with actual values
$apiKey = "YOUR_API_KEY"
$endpoint = "YOUR_ENDPOINT"

(Get-Content .env) -replace 'ROBOFLOW_API_KEY=.*', "ROBOFLOW_API_KEY=$apiKey" -replace 'ROBOFLOW_MODEL_ENDPOINT=.*', "ROBOFLOW_MODEL_ENDPOINT=$endpoint" | Set-Content .env
```

---

## ✅ **Verify Roboflow is Active**

After configuring, restart the server. You should see:

```
[INFO] Roboflow API configured - using Roboflow detection service (cloud)
[INFO] Detection service initialized in roboflow mode
```

**Instead of:**
```
[INFO] Roboflow not configured - using YOLOv8 detection service (local)
```

---

## 🧪 **Test Roboflow Detection**

1. **Restart server:**
```powershell
# Stop current server (Ctrl+C)
# Start again
.\venv_new\Scripts\python.exe main.py
```

2. **Check server logs** - Should say "roboflow mode"

3. **Upload 1.jpg** again via Swagger UI

4. **Expected Result:**
```json
{
  "detections": [
    {
      "class_name": "person",
      "confidence": "0.95",
      "threat_level": "caution"
    },
    {
      "class_name": "gun",
      "confidence": "0.87",
      "threat_level": "dangerous"
    }
  ]
}
```

---

## 🔍 **Finding Your Roboflow Details**

### **Where to Find API Key:**

1. **Roboflow Dashboard** → https://app.roboflow.com/
2. **Click your avatar** (top right)
3. **Settings** → **Roboflow API**
4. Copy the key

### **Where to Find Model Endpoint:**

1. Go to your **project**
2. Click on **Versions** (left sidebar)
3. Select your **trained version**
4. Click **Deploy** → **API**
5. You'll see:
```python
# Example code will show:
model_endpoint = "workspace-abc/weapon-detect/3"
```

---

## 📝 **Example Configuration**

Here's a complete example:

```env
# Roboflow Configuration
ROBOFLOW_API_KEY=rf_abc123def456ghi789jkl012mno345
ROBOFLOW_MODEL_ENDPOINT=my-workspace/weapon-detection-final/4
```

---

## 🚀 **Detection Priority System**

Your system automatically chooses the best detection method:

**Priority 1:** Roboflow API (if configured) ✅  
**Priority 2:** YOLOv8 Local (fallback) 🔄

**Current Status:** Using Priority 2 (YOLOv8) ❌  
**After Setup:** Will use Priority 1 (Roboflow) ✅

---

## ⚡ **Quick Fix Steps**

1. ✅ Get Roboflow API Key from dashboard
2. ✅ Get Model Endpoint from your project
3. ✅ Update `.env` file with both values
4. ✅ Restart the server
5. ✅ Upload 1.jpg again
6. ✅ Verify gun is detected correctly!

---

## 🔧 **Troubleshooting**

### **Issue: Still using YOLOv8**
**Solution:** Check server logs - API key might be invalid

### **Issue: "Roboflow API error"**
**Solution:** Verify API key and endpoint are correct

### **Issue: "Model not found"**
**Solution:** Check model endpoint format (workspace/model/version)

---

## 📞 **Need Help?**

Provide me with:
1. Your Roboflow API Key
2. Your Model Endpoint

I'll configure it for you immediately!

---

**Once configured, your gun detection will be accurate! 🎯**
