
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_profile_update():
    # 1. Login to get token
    login_data = {
        "email": "test@example.com", 
        "password": "Password123!" # Assuming a test user exists or we can register one. actually, let's just try to hit the endpoint and see if we get 401 (auth required) or 404 (not found)
    }
    
    print(f"Testing endpoint: {BASE_URL}/user/profile")
    
    # We expect 401 if it exists but we are not auth'd
    # We expect 404 if it does not exist
    
    try:
        response = requests.put(f"{BASE_URL}/user/profile", json={"name": "Test Name"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 404:
            print("❌ Endpoint not found (404)")
        elif response.status_code == 401:
            print("✅ Endpoint exists (401 Unauthorized) - Auth required")
        elif response.status_code == 200:
             print("✅ Endpoint exists and worked (200)")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_profile_update()
