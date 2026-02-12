# ✅ Complete Backend Testing Checklist

## 🎯 **Current Status: Authentication Working!**

You've successfully tested:
- ✅ User registration
- ✅ User login  
- ✅ Admin login

Now let's test EVERYTHING else!

---

## 📋 **Testing Plan Overview**

### **Phase 1: Authentication Features** ✅ (Done)
### **Phase 2: User Profile & Security** ⬅️ Start Here
### **Phase 3: Image Detection**
### **Phase 4: Video Detection**
### **Phase 5: Admin Features**
### **Phase 6: Security Features**
### **Phase 7: Database Verification**

---

## 🔐 **PHASE 2: User Profile & Security**

### **Test 1: Get Current User Profile**

**Endpoint**: `GET /api/v1/auth/me`

**Steps:**
1. In Swagger UI, make sure you're authorized with **user token**
2. Find `GET /api/v1/auth/me`
3. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "Test User",
  "email": "user@example.com",
  "role": "user",
  "mfa_enabled": false,
  "is_active": true,
  "created_at": "2025-10-27T...",
  "last_login_at": "2025-10-27T..."
}
```

**✅ Pass Criteria**: You see your user details

---

### **Test 2: Get User Statistics**

**Endpoint**: `GET /api/v1/user/stats`

**Steps:**
1. Find `GET /api/v1/user/stats`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "total_uploads": 0,
  "total_detections": 0,
  "dangerous_detections": 0,
  "recent_uploads": []
}
```

**✅ Pass Criteria**: You get statistics (even if zeros)

---

### **Test 3: Token Refresh**

**Endpoint**: `POST /api/v1/auth/refresh`

**Steps:**
1. Copy your **refresh_token** from login response
2. Find `POST /api/v1/auth/refresh`
3. Click "Try it out"
4. Enter:
```json
{
  "refresh_token": "your-refresh-token-here"
}
```
5. Click "Execute"

**Expected Response:**
```json
{
  "access_token": "new-token...",
  "refresh_token": "same-refresh-token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**✅ Pass Criteria**: You get a new access token

---

### **Test 4: Logout**

**Endpoint**: `POST /api/v1/auth/logout`

**Steps:**
1. Find `POST /api/v1/auth/logout`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

**✅ Pass Criteria**: Logout successful

**Then:** Login again to get a new token!

---

## 🖼️ **PHASE 3: Image Detection**

### **Test 5: Upload Image for Detection**

**Endpoint**: `POST /api/v1/detect/image`

**Steps:**
1. Make sure you have an image file (any .jpg or .png)
2. Find `POST /api/v1/detect/image`
3. Click "Try it out"
4. Click "Choose File" and select an image
5. Click "Execute"

**Expected Response:**
```json
{
  "upload_id": "uuid",
  "filename": "your-image.jpg",
  "detections": [
    {
      "class_name": "person",
      "confidence": "0.8543",
      "bbox": {
        "x1": 100.0,
        "y1": 150.0,
        "x2": 300.0,
        "y2": 450.0
      },
      "threat_level": "caution"
    }
  ],
  "summary": {
    "total_detections": 1,
    "dangerous_count": 0,
    "caution_count": 1,
    "harmless_count": 0,
    "classes_detected": ["person"],
    "has_dangerous_objects": false
  },
  "annotated_url": "path/to/annotated/image.jpg",
  "warnings": []
}
```

**✅ Pass Criteria**: 
- Image uploaded successfully
- Detections returned (may be empty if no objects)
- Annotated image path provided

---

### **Test 6: Get Upload Details**

**Endpoint**: `GET /api/v1/uploads/{id}`

**Steps:**
1. Copy the `upload_id` from previous test
2. Find `GET /api/v1/uploads/{id}`
3. Click "Try it out"
4. Paste the upload_id
5. Click "Execute"

**Expected Response:**
```json
{
  "id": "upload-id",
  "filename": "your-image.jpg",
  "file_type": "image",
  "file_path": "user_uuid/filename.jpg",
  "annotated_path": "outputs/user_uuid/filename.jpg",
  "detection_summary": {...},
  "is_processed": true,
  "created_at": "2025-10-27T...",
  "processed_at": "2025-10-27T..."
}
```

**✅ Pass Criteria**: You see upload details with detection summary

---

### **Test 7: Delete Upload**

**Endpoint**: `DELETE /api/v1/uploads/{id}`

**Steps:**
1. Use the same upload_id
2. Find `DELETE /api/v1/uploads/{id}`
3. Click "Try it out"
4. Paste the upload_id
5. Click "Execute"

**Expected Response:**
```json
{
  "message": "Upload deleted successfully"
}
```

**✅ Pass Criteria**: Upload deleted (status 200)

---

## 🎥 **PHASE 4: Video Detection**

### **Test 8: Upload Video for Detection**

**Endpoint**: `POST /api/v1/detect/video`

**Steps:**
1. Prepare a short video file (.mp4)
2. Find `POST /api/v1/detect/video`
3. Click "Try it out"
4. Choose video file
5. Click "Execute"

**Note:** This may take longer (video processing)

**Expected Response:**
```json
{
  "upload_id": "uuid",
  "filename": "video.mp4",
  "detections": [...],
  "summary": {...},
  "annotated_url": "path/to/video.mp4",
  "warnings": []
}
```

**✅ Pass Criteria**: 
- Video uploaded
- Detections per frame
- Annotated video created

---

## 👨‍💼 **PHASE 5: Admin Features**

**⚠️ IMPORTANT**: Authorize with **admin token** first!

### **Test 9: Get System Statistics**

**Endpoint**: `GET /api/v1/admin/stats`

**Steps:**
1. Logout and login as **admin@example.com**
2. Authorize with admin token
3. Find `GET /api/v1/admin/stats`
4. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "total_users": 2,
  "total_uploads": 2,
  "total_detections": 5,
  "total_alerts": 0,
  "recent_alerts": 0,
  "active_users": 2,
  "uploads_by_type": {
    "image": 1,
    "video": 1
  },
  "detections_by_threat": {
    "harmless": 3,
    "caution": 2,
    "dangerous": 0
  }
}
```

**✅ Pass Criteria**: System-wide statistics displayed

---

### **Test 10: List All Users**

**Endpoint**: `GET /api/v1/admin/users`

**Steps:**
1. Find `GET /api/v1/admin/users`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "Test User",
    "email": "user@example.com",
    "role": "user",
    "is_active": true,
    "created_at": "..."
  },
  {
    "id": "uuid-2",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "..."
  }
]
```

**✅ Pass Criteria**: All users listed

---

### **Test 11: Get Specific User**

**Endpoint**: `GET /api/v1/admin/users/{id}`

**Steps:**
1. Copy a user_id from previous response
2. Find `GET /api/v1/admin/users/{id}`
3. Paste user_id
4. Click "Execute"

**Expected Response:**
```json
{
  "id": "user-id",
  "name": "Test User",
  "email": "user@example.com",
  "role": "user",
  "mfa_enabled": false,
  "is_active": true,
  "created_at": "...",
  "last_login_at": "..."
}
```

**✅ Pass Criteria**: Specific user details shown

---

### **Test 12: Update User**

**Endpoint**: `PUT /api/v1/admin/users/{id}`

**Steps:**
1. Find `PUT /api/v1/admin/users/{id}`
2. Enter user_id
3. Set `is_active` to `false` (deactivate user)
4. Click "Execute"

**Expected Response:**
```json
{
  "id": "user-id",
  "is_active": false,
  ...
}
```

**✅ Pass Criteria**: User updated

**Then:** Set back to `true` to reactivate!

---

### **Test 13: List All Uploads (Admin)**

**Endpoint**: `GET /api/v1/admin/uploads`

**Steps:**
1. Find `GET /api/v1/admin/uploads`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
[
  {
    "id": "upload-1",
    "user_id": "user-id",
    "filename": "image.jpg",
    "file_type": "image",
    ...
  }
]
```

**✅ Pass Criteria**: All uploads from all users shown

---

### **Test 14: View All Alerts**

**Endpoint**: `GET /api/v1/admin/alerts`

**Steps:**
1. Find `GET /api/v1/admin/alerts`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
[
  {
    "id": "alert-id",
    "user_id": "user-id",
    "object_name": "knife",
    "threat_level": "dangerous",
    "confidence": "0.92",
    "timestamp": "..."
  }
]
```

**✅ Pass Criteria**: All dangerous object alerts shown

---

### **Test 15: View Audit Logs**

**Endpoint**: `GET /api/v1/admin/audit-logs`

**Steps:**
1. Find `GET /api/v1/admin/audit-logs`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
[
  {
    "id": "log-id",
    "user_id": "user-id",
    "action": "login",
    "resource": null,
    "status": "success",
    "created_at": "..."
  },
  {
    "action": "register",
    ...
  }
]
```

**✅ Pass Criteria**: All user actions logged and visible

---

### **Test 16: System Health Check**

**Endpoint**: `GET /api/v1/admin/system/health`

**Steps:**
1. Find `GET /api/v1/admin/system/health`
2. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "cpu_percent": 25.3,
  "memory_percent": 45.2,
  "disk_percent": 60.1,
  "status": "healthy"
}
```

**✅ Pass Criteria**: System metrics displayed

---

## 🔒 **PHASE 6: Security Features**

### **Test 17: MFA/2FA Setup**

**Endpoint**: `POST /api/v1/auth/enable-mfa`

**Steps:**
1. Authorize as regular user (not admin)
2. Find `POST /api/v1/auth/enable-mfa`
3. Click "Try it out" → "Execute"

**Expected Response:**
```json
{
  "secret": "BASE32SECRET",
  "qr_code_uri": "otpauth://totp/...",
  "backup_codes": [
    "abc123",
    "def456",
    ...
  ]
}
```

**✅ Pass Criteria**: 
- MFA secret generated
- QR code URI provided
- 10 backup codes generated
- **Note**: You would scan QR code with Google Authenticator

---

### **Test 18: Password Reset Request**

**Endpoint**: `POST /api/v1/auth/request-password-reset`

**Steps:**
1. Logout (or use without token)
2. Find `POST /api/v1/auth/request-password-reset`
3. Click "Try it out"
4. Enter:
```json
{
  "email": "user@example.com"
}
```
5. Click "Execute"

**Expected Response:**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

**✅ Pass Criteria**: 
- Success message (even if email doesn't exist - security)
- Email would be sent in production (with SMTP configured)

---

### **Test 19: Access Control Tests**

**Test A: User Tries Admin Endpoint**

**Steps:**
1. Authorize as **regular user**
2. Try `GET /api/v1/admin/stats`
3. Click "Execute"

**Expected Response:**
```json
{
  "detail": "Admin privileges required"
}
```

**✅ Pass Criteria**: 403 Forbidden ✅

---

**Test B: No Token on Protected Endpoint**

**Steps:**
1. Click Authorize → Logout
2. Try `GET /api/v1/auth/me` without token
3. Click "Execute"

**Expected Response:**
```json
{
  "detail": "Not authenticated"
}
```

**✅ Pass Criteria**: 403 Forbidden ✅

---

### **Test 20: Rate Limiting**

**Endpoint**: Any endpoint (e.g., login)

**Steps:**
1. Find `POST /api/v1/auth/login`
2. Click "Execute" rapidly **6 times**

**Expected Response (after 5 attempts):**
```json
{
  "error": "Rate limit exceeded"
}
```

**✅ Pass Criteria**: Rate limit kicks in (5 login attempts/minute)

---

## 🗄️ **PHASE 7: Database Verification**

### **Test 21: Check PostgreSQL Tables**

Open PowerShell:

```powershell
"E:\PostgreSQL\bin\psql.exe" -U postgres -d ai_detection
```

**Then run these SQL commands:**

#### **View Users:**
```sql
SELECT id, email, role, is_active, mfa_enabled FROM users;
```

**✅ Expected**: 2 users (1 user, 1 admin)

---

#### **View Uploads:**
```sql
SELECT id, user_id, filename, file_type, is_processed FROM uploads;
```

**✅ Expected**: Your uploaded images/videos

---

#### **View Detections:**
```sql
SELECT id, upload_id, class_name, confidence, threat_level FROM detections LIMIT 10;
```

**✅ Expected**: Individual object detections

---

#### **View Alerts:**
```sql
SELECT id, user_id, object_name, threat_level, confidence FROM alerts;
```

**✅ Expected**: Only dangerous object detections

---

#### **View Audit Logs:**
```sql
SELECT id, user_id, action, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

**✅ Expected**: All user actions (login, register, etc.)

---

#### **View Sessions:**
```sql
SELECT id, user_id, is_valid, created_at FROM sessions;
```

**✅ Expected**: Active sessions for logged-in users

---

### **Test 22: Check Files Created**

**PowerShell Commands:**

#### **View Uploaded Files:**
```powershell
Get-ChildItem -Path "uploads" -Recurse | Select-Object FullName
```

**✅ Expected**: User uploaded images/videos

---

#### **View Annotated Output:**
```powershell
Get-ChildItem -Path "outputs" -Recurse | Select-Object FullName
```

**✅ Expected**: Processed images with bounding boxes

---

#### **View Alert Logs:**
```powershell
Get-Content "outputs\alerts\alerts.log"
```

**✅ Expected**: Log entries for dangerous detections

---

## 📊 **COMPLETE TEST SUMMARY**

After completing all tests, verify:

### **✅ Checklist:**

**Authentication (5/5)**
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Token refresh works
- [ ] Logout works

**User Features (5/5)**
- [ ] Get user profile
- [ ] Get user statistics
- [ ] Upload image detection
- [ ] Get upload details
- [ ] Delete upload

**Admin Features (8/8)**
- [ ] System statistics
- [ ] List all users
- [ ] Get specific user
- [ ] Update user
- [ ] List all uploads
- [ ] View all alerts
- [ ] View audit logs
- [ ] System health check

**Security (5/5)**
- [ ] MFA setup works
- [ ] Password reset request
- [ ] User cannot access admin endpoints
- [ ] Protected endpoints require token
- [ ] Rate limiting active

**Database (6/6)**
- [ ] Users table populated
- [ ] Uploads table working
- [ ] Detections recorded
- [ ] Alerts created (if dangerous objects)
- [ ] Audit logs tracking
- [ ] Sessions managed

**Files (3/3)**
- [ ] Uploads directory has files
- [ ] Outputs directory has annotated files
- [ ] Alert logs created

---

## 🎯 **Performance Verification**

### **Expected Response Times:**

| Endpoint | Expected Time |
|----------|--------------|
| Health Check | < 50ms |
| Login | < 200ms |
| Image Detection | 1-3 seconds |
| Video Detection | 10-60 seconds |
| Database Queries | < 100ms |

---

## 🎉 **Success Criteria**

Your backend is **FULLY FUNCTIONAL** when:

✅ **All 22 tests pass**  
✅ **All 6 database tables populated**  
✅ **Files created in uploads/outputs**  
✅ **No errors in server logs**  
✅ **Rate limiting works**  
✅ **Access control enforced**  
✅ **PostgreSQL running smoothly**  

---

## 📝 **Next Steps After Testing**

Once all tests pass:

1. ✅ **Document your tests** - Note any issues
2. ✅ **Test with real images** - Use different objects
3. ✅ **Test dangerous objects** - Upload images with weapons (if available)
4. ✅ **Check email functionality** - Configure SMTP for production
5. ✅ **Setup Redis** - For rate limiting persistence
6. ✅ **Configure Celery** - For async video processing
7. ✅ **Build frontend** - Connect to this backend

---

**You now have a COMPLETE testing roadmap! Follow each phase step-by-step. Good luck! 🚀**
