import requests
import json

API_BASE_URL = "http://localhost:8000/api/v1"

# Test registration
print("Testing registration endpoint...")
try:
    response = requests.post(
        f"{API_BASE_URL}/auth/register",
        json={
            "name": "Test User",
            "email": "newuser@obai.local",
            "password": "TestPass123!"
        },
        headers={"Content-Type": "application/json"}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test login
print("\nTesting login endpoint...")
try:
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={
            "email": "newuser@obai.local",
            "password": "TestPass123!"
        },
        headers={"Content-Type": "application/json"}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
