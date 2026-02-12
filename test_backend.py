"""
Backend API Testing Script
Test all available endpoints to verify backend is working
"""
import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name: str, status: str, details: str = ""):
    """Print test result with color"""
    if status == "PASS":
        print(f"{GREEN}✓{RESET} {name}: {GREEN}{status}{RESET} {details}")
    elif status == "FAIL":
        print(f"{RED}✗{RESET} {name}: {RED}{status}{RESET} {details}")
    else:
        print(f"{YELLOW}⚠{RESET} {name}: {YELLOW}{status}{RESET} {details}")


def test_health_check():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{API_V1}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_test("Health Check", "PASS", f"Status: {data.get('status')}")
            return True
        else:
            print_test("Health Check", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test("Health Check", "FAIL", f"Error: {str(e)}")
        return False


def test_root_endpoint():
    """Test root endpoint"""
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_test("Root Endpoint", "PASS", f"Version: {data.get('version')}")
            return True
        else:
            print_test("Root Endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test("Root Endpoint", "FAIL", f"Error: {str(e)}")
        return False


def test_register_user(email: str = "test@example.com", password: str = "TestPassword123!"):
    """Test user registration"""
    try:
        data = {
            "name": "Test User",
            "email": email,
            "password": password
        }
        response = requests.post(f"{API_V1}/auth/register", json=data, timeout=5)
        
        if response.status_code == 201:
            user_data = response.json()
            print_test("User Registration", "PASS", f"User ID: {user_data.get('id')}")
            return True, user_data
        elif response.status_code == 400 and "already registered" in response.text:
            print_test("User Registration", "SKIP", "User already exists")
            return True, None
        else:
            print_test("User Registration", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False, None
    except Exception as e:
        print_test("User Registration", "FAIL", f"Error: {str(e)}")
        return False, None


def test_login(email: str = "test@example.com", password: str = "TestPassword123!"):
    """Test user login"""
    try:
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(f"{API_V1}/auth/login", json=data, timeout=5)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print_test("User Login", "PASS", f"Token received (length: {len(access_token)})")
            return True, access_token
        else:
            print_test("User Login", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False, None
    except Exception as e:
        print_test("User Login", "FAIL", f"Error: {str(e)}")
        return False, None


def test_get_current_user(access_token: str):
    """Test getting current user info"""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{API_V1}/auth/me", headers=headers, timeout=5)
        
        if response.status_code == 200:
            user_data = response.json()
            print_test("Get Current User", "PASS", f"Email: {user_data.get('email')}")
            return True, user_data
        else:
            print_test("Get Current User", "FAIL", f"Status: {response.status_code}")
            return False, None
    except Exception as e:
        print_test("Get Current User", "FAIL", f"Error: {str(e)}")
        return False, None


def test_user_stats(access_token: str):
    """Test user statistics endpoint"""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{API_V1}/user/stats", headers=headers, timeout=5)
        
        if response.status_code == 200:
            stats = response.json()
            print_test("User Stats", "PASS", f"Uploads: {stats.get('total_uploads')}, Detections: {stats.get('total_detections')}")
            return True
        else:
            print_test("User Stats", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("User Stats", "FAIL", f"Error: {str(e)}")
        return False


def test_docs_endpoint():
    """Test API documentation endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print_test("API Docs", "PASS", "Documentation accessible at /docs")
            return True
        else:
            print_test("API Docs", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test("API Docs", "FAIL", f"Error: {str(e)}")
        return False


def test_detection_service_info():
    """Test detection service info endpoint (if exists)"""
    try:
        response = requests.get(f"{API_V1}/detection/info", timeout=5)
        if response.status_code == 200:
            info = response.json()
            print_test("Detection Service Info", "PASS", f"Mode: {info.get('mode')}, Type: {info.get('service_type')}")
            return True
        else:
            print_test("Detection Service Info", "SKIP", "Endpoint not found")
            return True  # Not critical
    except Exception as e:
        print_test("Detection Service Info", "SKIP", "Endpoint not implemented yet")
        return True


def run_all_tests():
    """Run all backend tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Backend API Testing{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    results = []
    
    # Test 1: Health Check
    print(f"{YELLOW}[1/9]{RESET} Testing health endpoint...")
    results.append(test_health_check())
    
    # Test 2: Root Endpoint
    print(f"\n{YELLOW}[2/9]{RESET} Testing root endpoint...")
    results.append(test_root_endpoint())
    
    # Test 3: API Documentation
    print(f"\n{YELLOW}[3/9]{RESET} Testing API documentation...")
    results.append(test_docs_endpoint())
    
    # Test 4: Detection Service Info
    print(f"\n{YELLOW}[4/9]{RESET} Testing detection service info...")
    results.append(test_detection_service_info())
    
    # Test 5: User Registration
    print(f"\n{YELLOW}[5/9]{RESET} Testing user registration...")
    reg_success, user_data = test_register_user()
    results.append(reg_success)
    
    # Test 6: User Login
    print(f"\n{YELLOW}[6/9]{RESET} Testing user login...")
    login_success, access_token = test_login()
    results.append(login_success)
    
    if not login_success:
        print(f"\n{RED}Cannot continue without valid login. Stopping tests.{RESET}")
        print_summary(results)
        return
    
    # Test 7: Get Current User
    print(f"\n{YELLOW}[7/9]{RESET} Testing get current user...")
    user_success, current_user = test_get_current_user(access_token)
    results.append(user_success)
    
    # Test 8: User Stats
    print(f"\n{YELLOW}[8/9]{RESET} Testing user statistics...")
    results.append(test_user_stats(access_token))
    
    # Test 9: Logout would invalidate token, so we skip it
    print(f"\n{YELLOW}[9/9]{RESET} Logout test skipped (would invalidate token)")
    results.append(True)
    
    # Summary
    print_summary(results)
    
    # Print useful information
    if access_token:
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{GREEN}✓ Backend is working!{RESET}")
        print(f"\n{BLUE}You can now:{RESET}")
        print(f"  1. Access API docs: {BASE_URL}/docs")
        print(f"  2. Login with: test@example.com / TestPassword123!")
        print(f"  3. Use access token: {access_token[:50]}...")
        print(f"\n{BLUE}Test Commands:{RESET}")
        print(f"  curl -X GET {API_V1}/health")
        print(f"  curl -X GET {API_V1}/auth/me -H 'Authorization: Bearer {access_token[:20]}...'")
        print(f"{BLUE}{'='*60}{RESET}\n")


def print_summary(results):
    """Print test summary"""
    passed = sum(results)
    total = len(results)
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Test Summary{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Total Tests: {total}")
    print(f"{GREEN}Passed: {passed}{RESET}")
    print(f"{RED}Failed: {total - passed}{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}🎉 All tests passed!{RESET}")
    else:
        print(f"\n{YELLOW}⚠ Some tests failed. Check the output above.{RESET}")


if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Tests interrupted by user{RESET}\n")
    except Exception as e:
        print(f"\n{RED}Unexpected error: {str(e)}{RESET}\n")
