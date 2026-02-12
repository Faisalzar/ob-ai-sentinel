
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

def test_profile_update():
    print(f"Testing Profile Update Endpoint...")
    
    # 1. Login
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123!" 
    }
    
    try:
        # Register first to ensure user exists
        requests.post(f"{API_V1}/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPassword123!"
        })
        
        # Login
        response = requests.post(f"{API_V1}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return
            
        token = response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Update Profile
        new_name = "Updated Name " + str(json.dumps({"test": 1})) # make it unique-ish
        update_data = {"name": "Updated Name API Test"}
        
        print(f"Sending PUT to {API_V1}/user/profile with {update_data}")
        put_response = requests.put(f"{API_V1}/user/profile", json=update_data, headers=headers)
        
        print(f"Status Code: {put_response.status_code}")
        print(f"Response: {put_response.text}")
        
        if put_response.status_code == 200:
            print("✅ SUCCESS: Profile updated")
        elif put_response.status_code == 404:
            print("❌ FAILURE: Endpoint not found (404)")
        elif put_response.status_code == 405:
            print("❌ FAILURE: Method not allowed (405) - Check @router.put vs @router.post")
        else:
            print(f"⚠️ Unexpected status: {put_response.status_code}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_profile_update()
