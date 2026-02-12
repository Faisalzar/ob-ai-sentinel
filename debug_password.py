
import sys
import os
import requests

# Add project root to sys.path
sys.path.append(os.getcwd())

BASE_URL = "http://localhost:8000/api/v1"
import random
import string

def get_random_string(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

EMAIL = f"user_{get_random_string(6)}@example.com"
PASSWORD = "Password123!"
NEW_PASSWORD = "NewPassword123!"

def test_password_change():
    session = requests.Session()
    
    # 0. Register/Ensures user exists
    print(f"Ensuring user {EMAIL} exists...")
    try:
        resp = session.post(f"{BASE_URL}/auth/register", json={
            "email": EMAIL,
            "password": PASSWORD,
            "name": "Test User"
        })
        if resp.status_code == 201:
            print("User registered.")
        elif resp.status_code == 400 and "already registered" in resp.text:
            print("User already exists.")
    except Exception as e:
        print(f"Registration error: {e}")

    # 1. Login
    print(f"Logging in with {PASSWORD}...")
    login_data = {"email": EMAIL, "password": PASSWORD}
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json=login_data)
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            # Try logging in with NEW_PASSWORD in case it changed
            print(f"Trying new password {NEW_PASSWORD}...")
            login_data["password"] = NEW_PASSWORD
            resp = session.post(f"{BASE_URL}/auth/login", json=login_data)
            if resp.status_code != 200:
                print("FATAL: Could not login with either password.")
                return
            else:
                print("Logged in with NEW password (change persisted previously?)")
                return

        data = resp.json()
        token = data["access_token"]
        print("Login successful.")
        
        # 2. Change Password
        print("Changing password...")
        headers = {"Authorization": f"Bearer {token}"}
        change_data = {
            "current_password": PASSWORD,
            "new_password": NEW_PASSWORD
        }
        
        resp = session.post(
            f"{BASE_URL}/user/change-password",
            json=change_data,
            headers=headers
        )
        
        print(f"Change password response: {resp.status_code} {resp.text}")
        
        if resp.status_code == 200:
             # 3. Verify Login with New Password
             print("Verifying new password login...")
             login_data["password"] = NEW_PASSWORD
             resp = session.post(f"{BASE_URL}/auth/login", json=login_data)
             if resp.status_code == 200:
                 print("SUCCESS: Password changed and verified.")
                 # Revert
                 change_data = {"current_password": NEW_PASSWORD, "new_password": PASSWORD}
                 token = resp.json()["access_token"]
                 headers = {"Authorization": f"Bearer {token}"}
                 session.post(f"{BASE_URL}/user/change-password", json=change_data, headers=headers)
                 print("Password reverted to original.")
             else:
                 print(f"FAILURE: Could not login with new password. Status: {resp.status_code}")
                 
                 # Verify Old Password still works
                 login_data["password"] = PASSWORD
                 resp = session.post(f"{BASE_URL}/auth/login", json=login_data)
                 if resp.status_code == 200:
                     print(" CONFIRMED: Old password still works. Update failed to persist.")
                 else:
                     print(" WEIRD: Neither password works?")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_password_change()
