"""
Main FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.db.base import init_db
from backend.services.detection_service import detection_service
from backend.middleware.rate_limit import setup_rate_limiting

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting AI Object Detection Backend...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    # Initialize detection service (Roboflow or YOLOv8)
    try:
        logger.info(f"Initializing detection service in {detection_service.get_mode()} mode...")
        service_info = detection_service.get_service_info()
        logger.info(f"Detection service ready: {service_info['service_type']} ({service_info['model']})")
    except Exception as e:
        logger.error(f"Failed to initialize detection service: {e}")
        # Don't raise, allow app to start even if detection fails (for admin access)
        
    # Create/Update Admin User (Auto-Seed)
    try:
        from create_admin_user import create_admin
        logger.info("Running Admin User Seeding...")
        create_admin()
        logger.info("Admin User Seeding Complete")
    except Exception as e:
        logger.error(f"Failed to seed admin user: {e}")
        # Continue starting app
    
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")



# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Secure FastAPI backend with YOLOv8 object detection",
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Mount static files
from fastapi.staticfiles import StaticFiles
import os
uploads_dir = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")



# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Rate Limiting
setup_rate_limiting(app)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # HSTS (HTTP Strict Transport Security)
    response.headers["Strict-Transport-Security"] = f"max-age={settings.HSTS_MAX_AGE}; includeSubDomains"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = settings.CSP_POLICY
    
    # X-Frame-Options (prevent clickjacking)
    response.headers["X-Frame-Options"] = "DENY"
    
    # X-Content-Type-Options (prevent MIME sniffing)
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # X-XSS-Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response


# Health check endpoint
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "AI Object Detection Backend API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled in production"
    }


# API routers
from backend.api.v1.api import api_router
app.include_router(api_router, prefix="/api/v1")


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    logger.error(f"Internal server error: {exc}")
    
    detail = getattr(exc, "detail", "Internal server error")
    
    response = JSONResponse(
        status_code=500,
        content={"detail": detail}
    )
    
    # Manually add CORS headers to ensure error is visible to frontend
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
