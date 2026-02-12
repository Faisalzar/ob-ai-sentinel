"""
Storage factory - selects storage backend based on configuration
"""
from backend.storage.base import StorageInterface
from backend.storage.local_storage import LocalStorage
from backend.storage.s3_storage import S3Storage
from backend.core.config import settings


def get_storage() -> StorageInterface:
    """
    Factory function to get storage backend based on configuration
    
    Returns:
        Storage backend instance (LocalStorage or S3Storage)
    """
    if settings.STORAGE_MODE == "cloud":
        return S3Storage()
    else:
        return LocalStorage()


# Global storage instance (singleton)
storage = get_storage()
