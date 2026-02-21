"""
Cloudinary Storage implementation
"""
from typing import Optional, Any
import cloudinary
import cloudinary.uploader
import cloudinary.api
from backend.storage.base import StorageInterface
from backend.core.config import settings

class CloudinaryStorage(StorageInterface):
    """Cloudinary Storage handler"""

    def __init__(self):
        try:
            if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
                cloudinary.config( 
                  cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
                  api_key = settings.CLOUDINARY_API_KEY, 
                  api_secret = settings.CLOUDINARY_API_SECRET,
                  secure = True
                )
                print("Cloudinary Storage initialized successfully")
            else:
                print("WARNING: Cloudinary credentials not fully provided. Cloudinary Storage will fail.")
        except Exception as e:
            print(f"Cloudinary Init Error: {e}")

    async def save_file(self, file: Any, path: str) -> str:
        """Save file to Cloudinary and return public secure URL"""
        
        # Determine resource type
        resource_type = "auto"
        if path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            resource_type = "image"
        elif path.lower().endswith((".mp4", ".mov", ".avi")):
            resource_type = "video"

        # Read file data
        if hasattr(file, 'read'):
            try:
                if hasattr(file, 'seek'):
                     file.seek(0)
                body = file.read()
            except Exception:
                body = file 
        else:
            body = file

        # Format public_id (path without extension)
        public_id = path.replace('\\', '/')
        # Optionally remove extension for cleaner public_id in Cloudinary
        import os
        name, _ = os.path.splitext(public_id)

        # Prepend the unique project folder
        public_id = f"ob_ai_sentinel_evidence/{name}"

        try:
            # Upload to Cloudinary
            response = cloudinary.uploader.upload(
                body, 
                public_id=public_id,
                resource_type=resource_type,
                overwrite=True
            )
            return response.get('secure_url')
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            raise e

    async def get_file_url(self, path: str) -> str:
        """Get public URL for file"""
        # If we already saved the full URL in the DB, return it
        if path.startswith("http"):
            return path
            
        key = path.replace('\\', '/')
        name, _ = os.path.splitext(key)
        
        try:
            # Generate the URL
            url, _ = cloudinary.utils.cloudinary_url(name, secure=True)
            return url
        except Exception:
            return ""

    async def delete_file(self, path: str) -> bool:
        """Delete file from storage"""
        key = path.replace('\\', '/')
        
        # If it's a full URL, extract the public ID
        if "res.cloudinary.com" in key:
            # Typical URL: https://res.cloudinary.com/<cloud>/image/upload/v1234567/path/to/img.jpg
            # Public ID is everything after the version folder, minus the extension
            try:
                parts = key.split('/upload/')
                if len(parts) > 1:
                    after_upload = parts[1]
                    # Format is usually v[numbers]/public_id.ext
                    id_with_ext = "/".join(after_upload.split('/')[1:])
                    import os
                    name, _ = os.path.splitext(id_with_ext)
                    key = name
            except Exception:
                pass 
        else:
             import os
             name, _ = os.path.splitext(key)
             key = name

        try:
            result = cloudinary.uploader.destroy(key)
            return result.get('result') == 'ok'
        except Exception as e:
            print(f"Cloudinary delete failed: {e}")
            return False

    async def file_exists(self, path: str) -> bool:
        """Check if file exists by attempting to get details"""
        key = path.replace('\\', '/')
        import os
        name, _ = os.path.splitext(key)
        
        try:
            cloudinary.api.resource(name)
            return True
        except cloudinary.exceptions.NotFound:
            return False
        except Exception:
            return False

    async def get_file(self, path: str) -> Optional[bytes]:
        """Download file content"""
        url = await self.get_file_url(path)
        if not url:
            return None
            
        import urllib.request
        try:
            with urllib.request.urlopen(url) as response:
                return response.read()
        except Exception as e:
            print(f"Cloudinary download failed: {e}")
            return None
