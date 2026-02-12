# MFA Authentication Flow - Bug Fix Documentation

**Date**: January 23, 2026  
**Status**: FIXED ✅

---

## Problem Statement

### Original Bug
When a user clicked "Enable MFA" but did NOT complete the setup (did not scan the QR code with an authenticator app) and then logged out, the system partially treated MFA as enabled. On the next login:
- Email OTP was requested and verified successfully
- User was NOT redirected to the dashboard
- Login flow broke completely

### Root Cause
The system used a single boolean `mfa_enabled` flag, which was set to `True` immediately when "Enable MFA" was clicked, without waiting for the user to actually complete setup (scan QR + verify TOTP).

---

## Solution Overview

Implemented a **state-based MFA system** with three clear states:

1. **MFA_DISABLED** - MFA not enabled
2. **MFA_SETUP_IN_PROGRESS** - User clicked "Enable MFA" but hasn't completed verification
3. **MFA_ENABLED** - MFA fully enabled and enforced

---

## Database Changes

### New Columns Added to `users` Table

```sql
-- New enum type
CREATE TYPE mfastate AS ENUM ('disabled', 'setup_in_progress', 'enabled');

-- New columns
mfa_state               ENUM(mfastate)  NOT NULL DEFAULT 'disabled'
mfa_secret_temporary    TEXT            NULL
```

### Existing Columns (Modified Usage)

```sql
mfa_enabled             BOOLEAN         -- Deprecated but kept for backward compatibility
mfa_secret_encrypted    TEXT            -- Only populated when MFA is ENABLED
backup_codes_encrypted  TEXT            -- Stored during setup, kept after enabled
```

---

## API Endpoint Changes

### 1. POST `/api/v1/auth/login`

**New Behavior:**
- Checks `mfa_state` instead of `mfa_enabled`
- Only requires TOTP if `mfa_state == MFAState.ENABLED`
- If `mfa_state == MFAState.SETUP_IN_PROGRESS`, treats user as DISABLED (continues normal login)

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "requires_mfa": false,
  "mfa_required": false,
  "user": {
    "mfa_enabled": false  // Only true if state == ENABLED
  }
}
```

---

### 2. POST `/api/v1/auth/enable-mfa` (MODIFIED)

**Phase 1: Start MFA Setup**

**What Changed:**
- Sets `mfa_state = SETUP_IN_PROGRESS` (not ENABLED)
- Stores secret in `mfa_secret_temporary` (not `mfa_secret_encrypted`)
- MFA is NOT enforced during login yet

**Response:**
```json
{
  "secret": "BASE32SECRET",
  "qr_code_uri": "otpauth://totp/...",
  "backup_codes": ["CODE1", "CODE2", ...]
}
```

**User Actions After This:**
1. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
2. Call `/auth/confirm-mfa` with a valid TOTP code

---

### 3. POST `/api/v1/auth/confirm-mfa` (NEW)

**Phase 2: Complete MFA Setup**

**Purpose:** Verify user scanned QR code and has working authenticator app

**Request:**
```json
{
  "token": "123456"  // 6-digit TOTP code from authenticator app
}
```

**Process:**
1. Verifies `mfa_state == SETUP_IN_PROGRESS`
2. Decrypts `mfa_secret_temporary`
3. Validates TOTP code
4. If valid:
   - Moves `mfa_secret_temporary` → `mfa_secret_encrypted`
   - Sets `mfa_state = ENABLED`
   - Clears `mfa_secret_temporary`
   - Sends confirmation email with backup codes

**Response:**
```json
{
  "message": "MFA enabled successfully",
  "mfa_enabled": true
}
```

**After this point:** MFA is FULLY enabled and will be required on next login

---

### 4. POST `/api/v1/auth/logout` (MODIFIED)

**New Behavior:**
- If `mfa_state == SETUP_IN_PROGRESS`:
  - Clears `mfa_secret_temporary`
  - Resets `mfa_state = DISABLED`
  - Clears `backup_codes_encrypted`
  - Logs "mfa_setup_abandoned"

**Purpose:** Clean up incomplete MFA setups when user logs out

---

### 5. POST `/api/v1/auth/disable-mfa` (NEW)

**Purpose:** Allow users to fully disable MFA

**Request:**
```json
{
  "password": "user_password"  // Password confirmation required
}
```

**Security Checks:**
1. Verifies password is correct
2. (Optional) Prevents admins from disabling if MFA is mandatory

**Process:**
1. Sets `mfa_state = DISABLED`
2. Clears all MFA-related fields:
   - `mfa_secret_encrypted`
   - `mfa_secret_temporary`
   - `backup_codes_encrypted`
   - `mfa_enabled = False`

**Response:**
```json
{
  "message": "MFA disabled successfully",
  "mfa_enabled": false
}
```

---

## Complete MFA Flows

### Flow 1: Enable MFA (Complete Setup)

```
1. User clicks "Enable MFA"
   ↓
2. POST /auth/enable-mfa
   → mfa_state = SETUP_IN_PROGRESS
   → mfa_secret_temporary = <encrypted_secret>
   → Returns QR code
   ↓
3. User scans QR code with authenticator app
   ↓
4. User enters TOTP code from app
   ↓
5. POST /auth/confirm-mfa { "token": "123456" }
   → Validates TOTP
   → mfa_state = ENABLED
   → mfa_secret_encrypted = mfa_secret_temporary
   → mfa_secret_temporary = NULL
   ↓
6. MFA NOW ENFORCED on next login
```

---

### Flow 2: Enable MFA (Abandoned Setup)

```
1. User clicks "Enable MFA"
   ↓
2. POST /auth/enable-mfa
   → mfa_state = SETUP_IN_PROGRESS
   → Returns QR code
   ↓
3. User navigates away or logs out WITHOUT scanning
   ↓
4. POST /auth/logout
   → mfa_state = DISABLED
   → mfa_secret_temporary = NULL
   ↓
5. Next login: NO MFA required (correct behavior!)
```

---

### Flow 3: Login with MFA Enabled

```
1. POST /auth/login { "email": "...", "password": "..." }
   → Checks mfa_state == ENABLED
   → Returns requires_mfa=true + mfa_token
   ↓
2. Frontend shows TOTP input
   ↓
3. User enters TOTP code from authenticator app
   ↓
4. POST /auth/verify-mfa { "token": "123456", "mfa_token": "..." }
   → Validates TOTP against mfa_secret_encrypted
   → Returns access_token + refresh_token
   ↓
5. User logged in successfully
```

---

### Flow 4: Login with MFA Setup In Progress

```
1. POST /auth/login { "email": "...", "password": "..." }
   → Checks mfa_state == SETUP_IN_PROGRESS
   → Treats as DISABLED
   → Returns access_token + refresh_token immediately
   ↓
2. User logged in successfully (no MFA required)
```

---

### Flow 5: Disable MFA

```
1. User clicks "Disable MFA"
   ↓
2. User enters password
   ↓
3. POST /auth/disable-mfa { "password": "..." }
   → Verifies password
   → mfa_state = DISABLED
   → mfa_secret_encrypted = NULL
   → backup_codes_encrypted = NULL
   ↓
4. Next login: NO MFA required
```

---

## Migration Instructions

### For Existing Databases

Run the Alembic migration:

```bash
# Apply migration
alembic upgrade head
```

**What the migration does:**
1. Creates `mfastate` enum type
2. Adds `mfa_state` column
3. Adds `mfa_secret_temporary` column
4. Migrates existing data:
   - If `mfa_enabled = true` → `mfa_state = ENABLED`
   - If `mfa_enabled = false` → `mfa_state = DISABLED`

**Migration file:** `alembic/versions/002_add_mfa_state.py`

---

## Frontend Changes Required

### 1. Enable MFA Page

**Old Flow:**
```javascript
// User clicks "Enable MFA"
POST /auth/enable-mfa
// Show QR code
// User assumes MFA is enabled (WRONG!)
```

**New Flow:**
```javascript
// Step 1: Start setup
POST /auth/enable-mfa
// Show QR code + TOTP input field

// Step 2: User scans QR code and enters TOTP
POST /auth/confirm-mfa { token: totpCode }
// Only now is MFA fully enabled

// Show success message: "MFA enabled successfully"
```

### 2. Login Page

**No changes required** - backend handles the logic correctly

### 3. Profile/Settings Page

**Add "Disable MFA" Button:**
```javascript
// User clicks "Disable MFA"
// Show password confirmation modal

// User enters password
POST /auth/disable-mfa { password: userPassword }

// Success: MFA disabled
```

---

## Testing Checklist

### Test Case 1: Complete MFA Setup
- [ ] User enables MFA
- [ ] User scans QR code
- [ ] User enters valid TOTP code
- [ ] MFA is fully enabled
- [ ] Next login requires TOTP
- [ ] TOTP verification works

### Test Case 2: Abandoned MFA Setup (Logout)
- [ ] User enables MFA
- [ ] User does NOT scan QR code
- [ ] User logs out
- [ ] Next login does NOT require TOTP
- [ ] User can log in normally with just email OTP

### Test Case 3: Abandoned MFA Setup (Navigate Away)
- [ ] User enables MFA
- [ ] User does NOT scan QR code
- [ ] User navigates to another page
- [ ] User logs out
- [ ] Next login works normally

### Test Case 4: Disable MFA
- [ ] User with MFA enabled clicks "Disable MFA"
- [ ] System asks for password
- [ ] User enters correct password
- [ ] MFA is disabled
- [ ] Next login does NOT require TOTP

### Test Case 5: Invalid TOTP During Setup
- [ ] User enables MFA
- [ ] User enters invalid TOTP code
- [ ] System rejects with error
- [ ] MFA state remains SETUP_IN_PROGRESS
- [ ] User can try again

### Test Case 6: Invalid TOTP During Login
- [ ] User with MFA enabled logs in
- [ ] User enters invalid TOTP code
- [ ] Login is rejected
- [ ] User can try again

---

## Security Considerations

### ✅ Improvements
1. **No Partial States:** MFA is either fully enabled or fully disabled
2. **User Verification:** System confirms user actually scanned QR code
3. **Clean Logout:** Abandoned setups don't affect future logins
4. **Password Protection:** Disabling MFA requires password confirmation
5. **Audit Logging:** All MFA actions are logged

### 🔒 Future Enhancements
1. Add backup code verification during login
2. Add rate limiting to MFA endpoints
3. Add admin-enforced MFA policy
4. Add MFA recovery flow (if user loses device)
5. Add notification emails when MFA state changes

---

## Backward Compatibility

### Legacy `mfa_enabled` Field
- **Kept in database** for backward compatibility
- **Updated alongside `mfa_state`:**
  - `mfa_state = ENABLED` → `mfa_enabled = true`
  - `mfa_state = DISABLED` → `mfa_enabled = false`
  - `mfa_state = SETUP_IN_PROGRESS` → `mfa_enabled = false`

### Migration Path
- Existing users with MFA enabled are automatically migrated to `MFAState.ENABLED`
- No user action required
- All existing MFA setups continue to work

---

## Summary of Changes

### Backend Files Modified
1. `backend/models/models.py` - Added `MFAState` enum and new columns
2. `backend/api/v1/endpoints/auth.py` - Updated all MFA logic
3. `alembic/versions/002_add_mfa_state.py` - Database migration

### New Endpoints
- `POST /api/v1/auth/confirm-mfa` - Complete MFA setup
- `POST /api/v1/auth/disable-mfa` - Disable MFA

### Modified Endpoints
- `POST /api/v1/auth/login` - Fixed state-based MFA checking
- `POST /api/v1/auth/enable-mfa` - Now starts setup (not complete)
- `POST /api/v1/auth/logout` - Cleans up abandoned setups

---

## Status: READY FOR TESTING ✅

The MFA bug has been fixed with a complete state-based implementation. All edge cases are handled correctly, and the system is backward compatible with existing data.

**Next Steps:**
1. Run database migration
2. Test all flows manually
3. Update frontend to use new `/confirm-mfa` endpoint
4. Add disable MFA UI in user profile
5. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-23  
**Author:** AI Assistant (Warp)
