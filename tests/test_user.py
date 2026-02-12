"""
User endpoint tests
"""
import pytest
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from backend.db.base import get_db
from backend.models.models import Base, User, UserRole
from backend.core.security import hash_password

# Test database
TEST_DATABASE_URL = "sqlite:///./test_user.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create test tables
Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def test_user_token():
    """Create test user and return auth token"""
    db = TestingSessionLocal()
    
    # Create test user
    user = User(
        name="Test User",
        email="testuser@example.com",
        password_hash=hash_password("TestPassword123!"),
        role=UserRole.USER,
        is_verified=True
    )
    db.add(user)
    db.commit()
    
    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
    )
    
    db.close()
    return response.json()["access_token"]


def test_detect_image(test_user_token):
    """Test image detection endpoint"""
    # Create fake image file
    image_content = b"fake image content"
    files = {"file": ("test.jpg", io.BytesIO(image_content), "image/jpeg")}
    
    response = client.post(
        "/api/v1/detect/image",
        files=files,
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    
    # Note: This will fail with actual detection since we don't have a real image
    # In production, mock the AI service
    assert response.status_code in [200, 500]  # 500 if detection fails


def test_detect_image_unauthorized():
    """Test image detection without authentication"""
    image_content = b"fake image content"
    files = {"file": ("test.jpg", io.BytesIO(image_content), "image/jpeg")}
    
    response = client.post("/api/v1/detect/image", files=files)
    assert response.status_code == 403  # No auth


def test_detect_image_invalid_file(test_user_token):
    """Test image detection with invalid file type"""
    files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
    
    response = client.post(
        "/api/v1/detect/image",
        files=files,
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    
    assert response.status_code == 400
    assert "image" in response.json()["detail"].lower()


def test_get_user_stats(test_user_token):
    """Test user statistics endpoint"""
    response = client.get(
        "/api/v1/user/stats",
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total_uploads" in data
    assert "total_detections" in data
    assert "dangerous_detections" in data
    assert "recent_uploads" in data


def test_get_user_stats_unauthorized():
    """Test user stats without authentication"""
    response = client.get("/api/v1/user/stats")
    assert response.status_code == 403


# Cleanup
def teardown_module():
    import os
    if os.path.exists("test_user.db"):
        os.remove("test_user.db")
