# 🧪 Complete Testing Guide

## 📋 **Before You Start**

The server will run at: **http://localhost:8000**

### **Quick Links:**
- 📖 **API Documentation**: http://localhost:8000/docs
- 🔍 **Alternative Docs**: http://localhost:8000/redoc
- ❤️ **Health Check**: http://localhost:8000/api/v1/health

---

## 🚀 **Step 1: Start the Server**

Run this command:
```bash
.\venv_new\Scripts\python.exe main.py
```

You should see:
```
[INFO] Starting AI Object Detection Backend...
[INFO] Database initialized successfully
[INFO] YOLOv8 model loaded successfully
[INFO] Rate limiting middleware configured successfully
[INFO] Uvicorn running on http://0.0.0.0:8000
```

Keep this terminal open - the server is running!

---

## 👤 **Step 2: Register Regular User**

### **Option A: Using Swagger UI (Easiest)**

1. Open browser: **http://localhost:8000/docs**
2. Find **POST /api/v1/auth/register**
3. Click **"Try it out"**
4. Replace the example with:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "UserPass123!"
}
```

5. Click **"Execute"**
6. You should get **201 Created** response

### **Option B: Using PowerShell**

```powershell
$body = @{
    name = "Test User"
    email = "user@example.com"
    password = "UserPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### **Option C: Using cURL**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"user@example.com\",\"password\":\"UserPass123!\"}"
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "Test User",
  "email": "user@example.com",
  "role": "user",
  "mfa_enabled": false,
  "is_active": true,
  "created_at": "2025-10-27T..."
}
```

---

## 🔐 **Step 3: Login as User**

### **Using Swagger UI:**

1. Go to **POST /api/v1/auth/login**
2. Click **"Try it out"**
3. Enter:

```json
{
  "email": "user@example.com",
  "password": "UserPass123!"
}
```

4. Click **"Execute"**
5. **COPY the `access_token`** from response - you'll need it!

### **Using PowerShell:**

```powershell
$loginBody = @{
    email = "user@example.com"
    password = "UserPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.access_token
Write-Host "Access Token: $token"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "requires_mfa": false
}
```

---

## ✅ **Step 4: Test Protected Endpoint (User)**

### **Get User Profile:**

**Swagger UI:**
1. Copy your access token
2. Click **🔒 Authorize** button (top right)
3. Enter: `Bearer YOUR_ACCESS_TOKEN`
4. Click **Authorize**
5. Now try **GET /api/v1/auth/me**

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" -Headers $headers
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Test User",
  "email": "user@example.com",
  "role": "user"
}
```

---

## 👨‍💼 **Step 5: Create Admin User**

### **Method 1: Using Database Script**

```powershell
.\venv_new\Scripts\python.exe -c "
from backend.db.base import SessionLocal
from backend.models.models import User, UserRole
from backend.core.security import hash_password

db = SessionLocal()
admin = User(
    name='Admin User',
    email='admin@example.com',
    password_hash=hash_password('AdminPass123!'),
    role=UserRole.ADMIN,
    is_verified=True
)
db.add(admin)
db.commit()
print('✅ Admin user created!')
db.close()
"
```

### **Method 2: Using PostgreSQL**

```bash
"E:\PostgreSQL\bin\psql.exe" -U postgres -d ai_detection -c "
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
"
```

---

## 🔑 **Step 6: Login as Admin**

### **Using Swagger UI:**

1. **Logout first** (click Authorize, then logout)
2. Register a new user OR use the admin you created
3. Login with admin credentials:

```json
{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

4. Copy the new access token
5. Click **Authorize** and enter the admin token

### **Using PowerShell:**

```powershell
$adminLoginBody = @{
    email = "admin@example.com"
    password = "AdminPass123!"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminResponse.access_token
Write-Host "Admin Token: $adminToken"
```

---

## 🛡️ **Step 7: Test Admin Endpoints**

### **Get System Statistics:**

**Swagger UI:**
1. Make sure you're authorized with **admin token**
2. Find **GET /api/v1/admin/stats**
3. Click **"Try it out"** → **"Execute"**

**PowerShell:**
```powershell
$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/admin/stats" -Headers $adminHeaders
```

**Expected Response:**
```json
{
  "total_users": 2,
  "total_uploads": 0,
  "total_detections": 0,
  "total_alerts": 0,
  "recent_alerts": 0,
  "active_users": 2
}
```

### **List All Users:**

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/admin/users" -Headers $adminHeaders
```

---

## 🖼️ **Step 8: Test Image Detection (User)**

### **Using Swagger UI:**

1. Authorize with **user token** (not admin)
2. Find **POST /api/v1/detect/image**
3. Click **"Try it out"**
4. Click **"Choose File"** and select an image
5. Click **"Execute"**

### **Using PowerShell:**

```powershell
$userHeaders = @{
    Authorization = "Bearer $token"
}

# Create a test file
$imagePath = "test.jpg"

$form = @{
    file = Get-Item -Path $imagePath
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/detect/image" -Method POST -Headers $userHeaders -Form $form
```

---

## ✅ **Verification Checklist**

Test each of these:

### **User Endpoints:**
- [ ] ✅ Register user (`POST /api/v1/auth/register`)
- [ ] ✅ Login user (`POST /api/v1/auth/login`)
- [ ] ✅ Get user profile (`GET /api/v1/auth/me`)
- [ ] ✅ Get user stats (`GET /api/v1/user/stats`)
- [ ] ✅ Upload image for detection (`POST /api/v1/detect/image`)

### **Admin Endpoints:**
- [ ] ✅ Create admin user (via script)
- [ ] ✅ Login as admin
- [ ] ✅ Get system stats (`GET /api/v1/admin/stats`)
- [ ] ✅ List all users (`GET /api/v1/admin/users`)
- [ ] ✅ Access denied for regular user on admin endpoints

### **Security Tests:**
- [ ] ✅ Cannot access protected endpoints without token
- [ ] ✅ Regular user cannot access admin endpoints
- [ ] ✅ Password validation works (weak passwords rejected)
- [ ] ✅ Duplicate email registration fails

---

## 🎯 **Quick Test Scenarios**

### **Scenario 1: Full User Flow**
```
1. Register user
2. Login user
3. Get profile
4. Upload image
5. Check user stats
```

### **Scenario 2: Full Admin Flow**
```
1. Create admin (via script)
2. Login admin
3. Get system stats
4. List all users
5. View all alerts
```

### **Scenario 3: Security Test**
```
1. Try admin endpoint with user token → Should fail (403)
2. Try protected endpoint without token → Should fail (403)
3. Try login with wrong password → Should fail (401)
```

---

## 📊 **Expected Database State After Testing**

**Users Table:**
- ✅ 1 regular user (user@example.com)
- ✅ 1 admin user (admin@example.com)

**Sessions Table:**
- ✅ 2 sessions (one per login)

**Uploads Table:**
- ✅ 1+ uploads (from image detection tests)

**Audit Logs:**
- ✅ Multiple entries (register, login, etc.)

---

## 🐛 **Troubleshooting**

### **Error: "Invalid credentials"**
✅ Check email and password are correct

### **Error: "Admin privileges required"**
✅ Make sure you're using admin token, not user token

### **Error: "Token expired"**
✅ Login again to get new token

### **Error: "Email already registered"**
✅ Use a different email or login instead

---

## 🎉 **Success Indicators**

You'll know everything works when:

1. ✅ User can register and login
2. ✅ User can access their own endpoints
3. ✅ User **cannot** access admin endpoints
4. ✅ Admin can login
5. ✅ Admin can access all admin endpoints
6. ✅ Image detection works
7. ✅ Database shows all records
8. ✅ No error messages in server logs

---

## 📝 **API Endpoints Summary**

### **Public Endpoints:**
- `GET /` - Root
- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login

### **User Endpoints (Token Required):**
- `GET /api/v1/auth/me` - Current user
- `POST /api/v1/detect/image` - Upload image
- `POST /api/v1/detect/video` - Upload video
- `GET /api/v1/user/stats` - User statistics
- `GET /api/v1/uploads/{id}` - Get upload
- `DELETE /api/v1/uploads/{id}` - Delete upload

### **Admin Endpoints (Admin Token Required):**
- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/{id}` - Get user
- `PUT /api/v1/admin/users/{id}` - Update user
- `DELETE /api/v1/admin/users/{id}` - Delete user
- `GET /api/v1/admin/uploads` - All uploads
- `GET /api/v1/admin/alerts` - All alerts
- `GET /api/v1/admin/audit-logs` - Audit logs

---

**Ready to test? Start the server and follow the steps above! 🚀**
