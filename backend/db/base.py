"""
Database session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.core.config import settings
from typing import Generator

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from backend.models.models import Base
    Base.metadata.create_all(bind=engine)
