"""
Rate Limiting Middleware
Prevents API abuse and DDoS attacks
"""
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
import redis.asyncio as redis

from backend.core.config import settings

logger = logging.getLogger(__name__)


def get_redis_client():
    """Get Redis client for rate limiting storage"""
    try:
        client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        logger.info("Redis client initialized for rate limiting")
        return client
    except Exception as e:
        logger.warning(f"Redis connection failed, using in-memory storage: {e}")
        return None


# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL if settings.REDIS_URL else "memory://",
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"]
)


# Custom rate limit key function for authenticated users
def get_user_or_ip(request: Request) -> str:
    """
    Get rate limit key based on user ID (if authenticated) or IP address
    
    Args:
        request: FastAPI request object
        
    Returns:
        Rate limit identifier (user_id or IP address)
    """
    # Check if user is authenticated
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from backend.core.security import decode_token
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            if payload and payload.get("sub"):
                return f"user:{payload.get('sub')}"
        except Exception:
            pass
    
    # Fall back to IP address
    return get_remote_address(request)


# Limiter with user-based identification
user_limiter = Limiter(
    key_func=get_user_or_ip,
    storage_uri=settings.REDIS_URL if settings.REDIS_URL else "memory://",
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"]
)


# Login-specific rate limiter (more strict)
login_limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL if settings.REDIS_URL else "memory://",
    default_limits=[f"{settings.LOGIN_RATE_LIMIT_PER_MINUTE}/minute"]
)


def setup_rate_limiting(app):
    """
    Setup rate limiting for FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Add limiter state to app
    app.state.limiter = limiter
    
    # Add exception handler for rate limit exceeded
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    logger.info("Rate limiting middleware configured successfully")
    logger.info(f"Default rate limit: {settings.RATE_LIMIT_PER_MINUTE} requests/minute")
    logger.info(f"Login rate limit: {settings.LOGIN_RATE_LIMIT_PER_MINUTE} requests/minute")


# Decorators for different rate limit tiers
def rate_limit_standard():
    """Standard rate limit decorator"""
    return limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")


def rate_limit_strict():
    """Strict rate limit for sensitive endpoints"""
    return limiter.limit(f"{settings.LOGIN_RATE_LIMIT_PER_MINUTE}/minute")


def rate_limit_relaxed():
    """Relaxed rate limit for read-only endpoints"""
    return limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE * 2}/minute")
