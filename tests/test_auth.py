"""
Authentication endpoint tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from backend.db.base import get_db
from backend.models.models import Base

# Test database URL (use SQLite for testing)
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_register_user():
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data


def test_register_duplicate_email():
    """Test registration with duplicate email"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User 2",
            "email": "test@example.com",  # Same email
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_weak_password():
    """Test registration with weak password"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User 3",
            "email": "test3@example.com",
            "password": "weak"  # Too weak
        }
    )
    assert response.status_code == 422  # Validation error


def test_login_success():
    """Test successful login"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password():
    """Test login with wrong password"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code == 401


def test_login_nonexistent_user():
    """Test login with non-existent user"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
    )
    assert response.status_code == 401


def test_get_current_user():
    """Test getting current user info"""
    # First login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    token = login_response.json()["access_token"]
    
    # Get user info
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_unauthorized_access():
    """Test accessing protected endpoint without token"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403  # No credentials


def test_invalid_token():
    """Test accessing endpoint with invalid token"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


# Cleanup
def teardown_module():
    """Clean up after tests"""
    import os
    if os.path.exists("test.db"):
        os.remove("test.db")
