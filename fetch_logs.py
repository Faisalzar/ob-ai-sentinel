import requests

# Fetch the admin login token
url = "https://ob-ai-sentinel.onrender.com/api/v1/auth/login"
data = {"username": "admin@obaisentinel.com", "password": "AdminPassword123!"}
response = requests.post(url, data=data)
token = response.json().get("access_token")

# Fetch recent system logs
headers = {"Authorization": f"Bearer {token}"}
logs_url = "https://ob-ai-sentinel.onrender.com/api/v1/admin/logs?limit=50"
logs_resp = requests.get(logs_url, headers=headers)

if logs_resp.status_code == 200:
    for log in logs_resp.json():
        if log.get("level") in ["ERROR", "WARNING", "INFO"]:
            print(f"[{log.get('level')}] {log.get('timestamp')}: {log.get('message')}")
else:
    print("Failed to get logs:", logs_resp.text)
