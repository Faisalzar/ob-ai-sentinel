"""
API v1 router aggregation
"""
from fastapi import APIRouter
from backend.api.v1.endpoints import auth, user, admin, contact

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(admin.router)
api_router.include_router(contact.router, tags=["Contact"])
