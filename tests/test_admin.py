"""
Admin endpoint tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from backend.db.base import get_db
from backend.models.models import Base, User, UserRole
from backend.core.security import hash_password

# Test database
TEST_DATABASE_URL = "sqlite:///./test_admin.db"
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
def admin_token():
    """Create admin user and return auth token"""
    db = TestingSessionLocal()
    
    # Create admin user
    admin = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.ADMIN,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "AdminPass123!"
        }
    )
    
    db.close()
    return response.json()["access_token"]


@pytest.fixture
def regular_user_token():
    """Create regular user and return auth token"""
    db = TestingSessionLocal()
    
    user = User(
        name="Regular User",
        email="user@example.com",
        password_hash=hash_password("UserPass123!"),
        role=UserRole.USER,
        is_verified=True
    )
    db.add(user)
    db.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "UserPass123!"
        }
    )
    
    db.close()
    return response.json()["access_token"]


def test_get_admin_stats(admin_token):
    """Test admin statistics endpoint"""
    response = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_uploads" in data
    assert "total_detections" in data
    assert "total_alerts" in data


def test_get_admin_stats_forbidden(regular_user_token):
    """Test admin stats with regular user (should fail)"""
    response = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    
    assert response.status_code == 403


def test_list_users(admin_token):
    """Test listing all users"""
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # At least admin and regular user


def test_list_users_forbidden(regular_user_token):
    """Test listing users as regular user (should fail)"""
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    
    assert response.status_code == 403


def test_get_specific_user(admin_token, regular_user_token):
    """Test getting specific user details"""
    # First get list of users
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = response.json()
    user_id = users[0]["id"]
    
    # Get specific user
    response = client.get(
        f"/api/v1/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    assert "id" in response.json()
    assert "email" in response.json()


def test_update_user(admin_token):
    """Test updating user"""
    # Get a user
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = response.json()
    user_id = users[1]["id"]  # Get non-admin user
    
    # Update user
    response = client.put(
        f"/api/v1/admin/users/{user_id}?is_active=false",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200


def test_delete_user(admin_token):
    """Test deleting user"""
    db = TestingSessionLocal()
    
    # Create a user to delete
    user = User(
        name="Delete Me",
        email="delete@example.com",
        password_hash=hash_password("DeletePass123!"),
        role=UserRole.USER
    )
    db.add(user)
    db.commit()
    user_id = str(user.id)
    db.close()
    
    # Delete user
    response = client.delete(
        f"/api/v1/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()


# Cleanup
def teardown_module():
    import os
    if os.path.exists("test_admin.db"):
        os.remove("test_admin.db")
