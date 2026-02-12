import requests
import time
from sqlalchemy import create_engine, text
from backend.core.config import settings

API_BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "forgotpass@test.com"
PASSWORD = "OldPassword123!"
NEW_PASSWORD = "NewPassword123!"

def get_otp_from_db(email):
    """Retrieve OTP directly from DB for testing"""
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT password_reset_otp FROM users WHERE email='{email}'"))
        return result.scalar()

def test_flow():
    print("=== Testing Forgot Password Flow ===")
    
    # 1. Register
    print("\n1. Registering user...")
    requests.post(f"{API_BASE_URL}/auth/register", json={
        "name": "Forgot Test", "email": EMAIL, "password": PASSWORD
    })
    
    # 2. Request Reset
    print("2. Requesting Password Reset...")
    res = requests.post(f"{API_BASE_URL}/auth/request-password-reset", json={"email": EMAIL})
    print(f"   Response: {res.json()}")
    assert res.status_code == 200
    
    # 3. Get OTP from DB
    otp = get_otp_from_db(EMAIL)
    print(f"3. Retrieved OTP from DB: {otp}")
    assert otp is not None
    
    # 4. Verify OTP
    print("4. Verifying OTP...")
    res = requests.post(f"{API_BASE_URL}/auth/verify-password-reset-otp", json={
        "email": EMAIL, "otp": otp
    })
    data = res.json()
    print(f"   Response: {data}")
    assert res.status_code == 200
    reset_token = data.get("reset_token")
    assert reset_token is not None
    
    # 5. Reset Password
    print("5. Resetting Password...")
    res = requests.post(f"{API_BASE_URL}/auth/reset-password", json={
        "token": reset_token, "new_password": NEW_PASSWORD
    })
    print(f"   Response: {res.json()}")
    assert res.status_code == 200
    
    # 6. Login with Old Password (Should fail)
    print("6. Testing Login with OLD password (should fail)...")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "email": EMAIL, "password": PASSWORD
    })
    print(f"   Status: {res.status_code}")
    assert res.status_code == 401
    
    # 7. Login with New Password (Should succeed)
    print("7. Testing Login with NEW password (should succeed)...")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "email": EMAIL, "password": NEW_PASSWORD
    })
    print(f"   Status: {res.status_code}")
    assert res.status_code == 200
    
    print("\n✅ Verified! Forgot Password flow works.")

if __name__ == "__main__":
    test_flow()
