"""
Storage factory - selects storage backend based on configuration
"""
from backend.storage.base import StorageInterface
from backend.storage.local_storage import LocalStorage
from backend.storage.s3_storage import S3Storage
from backend.storage.cloudinary_storage import CloudinaryStorage
from backend.core.config import settings


def get_storage() -> StorageInterface:
    """
    Factory function to get storage backend based on configuration
    
    Returns:
        Storage backend instance (LocalStorage, S3Storage, or FirebaseStorage)
    """
    if settings.STORAGE_MODE == "cloud":
        return S3Storage()
    elif settings.STORAGE_MODE == "cloudinary":
        return CloudinaryStorage()
    elif settings.STORAGE_MODE == "s3":
        return S3Storage()
    else:
        return LocalStorage()


# Global storage instance (singleton)
storage = get_storage()
