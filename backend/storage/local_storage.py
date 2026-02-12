"""
Local filesystem storage implementation
"""
import os
import aiofiles
from pathlib import Path
from typing import Optional, BinaryIO
from backend.storage.base import StorageInterface
from backend.core.config import settings


class LocalStorage(StorageInterface):
    """Local filesystem storage handler"""
    
    def __init__(self):
        self.upload_path = Path(settings.LOCAL_UPLOAD_PATH)
        self.output_path = Path(settings.LOCAL_OUTPUT_PATH)
        
        # Create directories if they don't exist
        self.upload_path.mkdir(parents=True, exist_ok=True)
        self.output_path.mkdir(parents=True, exist_ok=True)
    
    async def save_file(self, file: BinaryIO, path: str) -> str:
        """
        Save file to local filesystem
        
        Args:
            file: File-like object
            path: Relative path where to save
            
        Returns:
            Full path to saved file
        """
        # Determine base directory from path
        if path.startswith("outputs/"):
            full_path = self.output_path / path.replace("outputs/", "", 1)
        else:
            full_path = self.upload_path / path
        
        # Create parent directories
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file
        async with aiofiles.open(full_path, 'wb') as f:
            if hasattr(file, 'read'):
                content = file.read()
                await f.write(content)
            else:
                await f.write(file)
        
        return str(full_path)
    
    async def get_file_url(self, path: str) -> str:
        """
        Get URL/path to access file
        
        Args:
            path: Relative path to file
            
        Returns:
            File path (for local storage, this is the absolute path)
        """
        if path.startswith("outputs/"):
            full_path = self.output_path / path.replace("outputs/", "", 1)
        else:
            full_path = self.upload_path / path
        
        return str(full_path.absolute())
    
    async def delete_file(self, path: str) -> bool:
        """
        Delete file from filesystem
        
        Args:
            path: Relative path to file
            
        Returns:
            True if successful
        """
        try:
            if path.startswith("outputs/"):
                full_path = self.output_path / path.replace("outputs/", "", 1)
            else:
                full_path = self.upload_path / path
            
            if full_path.exists():
                full_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {path}: {e}")
            return False
    
    async def file_exists(self, path: str) -> bool:
        """
        Check if file exists
        
        Args:
            path: Relative path to file
            
        Returns:
            True if file exists
        """
        if path.startswith("outputs/"):
            full_path = self.output_path / path.replace("outputs/", "", 1)
        else:
            full_path = self.upload_path / path
        
        return full_path.exists()
    
    async def get_file(self, path: str) -> Optional[bytes]:
        """
        Get file contents
        
        Args:
            path: Relative path to file
            
        Returns:
            File contents as bytes or None
        """
        try:
            if path.startswith("outputs/"):
                full_path = self.output_path / path.replace("outputs/", "", 1)
            else:
                full_path = self.upload_path / path
            
            if not full_path.exists():
                return None
            
            async with aiofiles.open(full_path, 'rb') as f:
                return await f.read()
        except Exception as e:
            print(f"Error reading file {path}: {e}")
            return None
