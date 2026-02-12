
import requests
import time

URL = "http://localhost:8000/api/v1/ping-check"

print(f"Testing {URL}...")
try:
    response = requests.get(URL, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
