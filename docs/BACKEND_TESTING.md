# Backend Testing Guide

## 🚀 Quick Start

### 1. Start the Server

```bash
# Make sure you're in the project directory
python main.py
```

The server will start on `http://localhost:8000`

### 2. Run Automated Tests

```bash
# In a new terminal (keep server running)
python test_backend.py
```

### 3. Access API Documentation

Open your browser: **http://localhost:8000/docs**

This shows all available API endpoints with interactive testing!

---

## ✅ Available Endpoints

### Authentication (`/api/v1/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | Register new user | ❌ No |
| `/auth/login` | POST | Login and get tokens | ❌ No |
| `/auth/me` | GET | Get current user info | ✅ Yes |
| `/auth/refresh` | POST | Refresh access token | ❌ No |
| `/auth/enable-mfa` | POST | Enable 2FA | ✅ Yes |
| `/auth/verify-mfa` | POST | Verify 2FA code | ❌ No |
| `/auth/logout` | POST | Logout | ✅ Yes |

### User Operations

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/detect/image` | POST | Detect objects in image | ✅ Yes |
| `/detect/video` | POST | Detect objects in video | ✅ Yes |
| `/user/stats` | GET | Get user statistics | ✅ Yes |
| `/uploads/{id}` | GET | Get upload details | ✅ Yes |
| `/uploads/{id}` | DELETE | Delete upload | ✅ Yes |

### Admin Operations (`/api/v1/admin`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/admin/stats` | GET | System-wide statistics | ✅ Admin |
| `/admin/users` | GET | List all users | ✅ Admin |
| `/admin/users/{id}` | GET | Get user details | ✅ Admin |
| `/admin/users/{id}` | PUT | Update user | ✅ Admin |
| `/admin/users/{id}` | DELETE | Delete user | ✅ Admin |
| `/admin/uploads` | GET | List all uploads | ✅ Admin |
| `/admin/alerts` | GET | List all alerts | ✅ Admin |
| `/admin/audit-logs` | GET | View audit logs | ✅ Admin |
| `/admin/reprocess/{id}` | POST | Reprocess upload | ✅ Admin |
| `/admin/export/alerts` | GET | Export alerts as CSV | ✅ Admin |
| `/admin/system/health` | GET | System health metrics | ✅ Admin |

### Health Check

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/health` | GET | Health check | ❌ No |
| `/` | GET | Root info | ❌ No |

---

## 🧪 Manual Testing Examples

### 1. Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "status": "healthy",
  "app": "AI Object Detection Backend",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Register a User

```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "Test User",
  "email": "test@example.com",
  "role": "user",
  "is_active": true,
  "is_verified": true
}
```

### 3. Login

```powershell
$loginBody = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.access_token
Write-Host "Access Token: $accessToken"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 4. Get Current User (with Authentication)

```powershell
# Use the $accessToken from login
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/me" `
    -Method GET `
    -Headers $headers | Select-Object -ExpandProperty Content
```

### 5. Get User Statistics

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/user/stats" `
    -Method GET `
    -Headers $headers | Select-Object -ExpandProperty Content
```

### 6. Upload and Detect Image

```powershell
# Prepare file
$filePath = "test_image.jpg"
$uri = "http://localhost:8000/api/v1/detect/image"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $filePath -Leaf)`"",
    "Content-Type: image/jpeg$LF",
    [System.IO.File]::ReadAllText($filePath),
    "--$boundary--$LF"
) -join $LF

$headers["Content-Type"] = "multipart/form-data; boundary=$boundary"

Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $bodyLines
```

---

## 🔐 Authentication Flow

### Standard Login Flow:
```
1. Register: POST /api/v1/auth/register
   ↓
2. Login: POST /api/v1/auth/login
   ↓ (returns access_token + refresh_token)
3. Access Protected Endpoints: Add header
   Authorization: Bearer <access_token>
   ↓
4. Token Expires (30 min) → Refresh Token
   POST /api/v1/auth/refresh
```

### With MFA (2FA):
```
1. Register + Login (normal)
   ↓
2. Enable MFA: POST /api/v1/auth/enable-mfa
   ↓ (returns QR code for authenticator app)
3. Future Logins: POST /api/v1/auth/login
   ↓ (returns requires_mfa: true)
4. Verify MFA: POST /api/v1/auth/verify-mfa
   ↓ (returns access_token)
5. Access Protected Endpoints
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" error
**Solution**: Make sure the server is running (`python main.py`)

### Issue: "401 Unauthorized"
**Solution**: 
1. Check if token is valid (not expired)
2. Verify `Authorization: Bearer <token>` header is set correctly

### Issue: "500 Internal Server Error"
**Solution**: 
1. Check server logs in the terminal where you ran `python main.py`
2. Common causes:
   - Database connection issues
   - Missing dependencies
   - AI model not found

### Issue: "404 Not Found"
**Solution**: Check endpoint path - remember the `/api/v1` prefix

---

## 📊 Testing Checklist

Use this checklist to verify all backend functionality:

### Basic Tests
- [ ] Server starts without errors
- [ ] Health endpoint (`/api/v1/health`) returns 200
- [ ] API docs (`/docs`) loads successfully
- [ ] Root endpoint (`/`) returns version info

### Authentication Tests
- [ ] User registration works
- [ ] Login returns access token
- [ ] Get current user with token works
- [ ] Logout invalidates session
- [ ] Token refresh works
- [ ] MFA enable/verify works

### Detection Tests
- [ ] Image detection endpoint accepts uploads
- [ ] Detections are returned correctly
- [ ] Annotated images are saved
- [ ] Dangerous objects trigger alerts
- [ ] Video detection works (slower)

### User Tests
- [ ] User statistics endpoint works
- [ ] Upload history retrieval works
- [ ] Upload deletion works

### Admin Tests (requires admin user)
- [ ] System statistics accessible
- [ ] User management works
- [ ] Alert viewing works
- [ ] Audit log viewing works
- [ ] System health metrics work

---

## 🎯 Quick Test Script

Save this as `quick_test.ps1`:

```powershell
# Quick Backend Test Script
$baseUrl = "http://localhost:8000"

Write-Host "Testing Backend..." -ForegroundColor Cyan

# Test 1: Health
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/api/v1/health" | ConvertFrom-Json -AsHashtable
    Write-Host "✓ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed" -ForegroundColor Red
    exit 1
}

# Test 2: Register
$user = @{
    name = "Test User"
    email = "test_$(Get-Random)@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/register" `
        -Method POST -Body $user -ContentType "application/json"
    Write-Host "✓ Registration successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Registration failed" -ForegroundColor Red
}

# Test 3: Login
$login = @{
    email = ($user | ConvertFrom-Json).email
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST -Body $login -ContentType "application/json"
    $tokens = $loginResponse.Content | ConvertFrom-Json
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Access Token: $($tokens.access_token.Substring(0,50))..." -ForegroundColor Yellow
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
}

Write-Host "`nBackend is working! ✓" -ForegroundColor Green
Write-Host "Open http://localhost:8000/docs for API documentation" -ForegroundColor Cyan
```

Run it:
```powershell
.\quick_test.ps1
```

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs (interactive Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc
- **Project README**: [../README.md](../README.md)
- **Quickstart Guide**: [QUICKSTART.md](QUICKSTART.md)
- **AI Detection Setup**: [AI_DETECTION_SETUP.md](AI_DETECTION_SETUP.md)

---

## 🎉 Success Indicators

Your backend is working properly if:

1. ✅ Server starts without errors
2. ✅ Health endpoint returns `"status": "healthy"`
3. ✅ User registration creates new users
4. ✅ Login returns access tokens
5. ✅ Protected endpoints work with token
6. ✅ API docs are accessible at `/docs`
7. ✅ Database is initialized (check `ai_detection.db` file exists)
8. ✅ YOLOv8 model loads successfully (check startup logs)

**You're all set! 🚀**
