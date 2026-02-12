"""
Base storage interface
"""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageInterface(ABC):
    """Abstract base class for storage backends"""
    
    @abstractmethod
    async def save_file(self, file: BinaryIO, path: str) -> str:
        """
        Save file to storage
        
        Args:
            file: File-like object
            path: Relative path where to save
            
        Returns:
            Full path or URL to saved file
        """
        pass
    
    @abstractmethod
    async def get_file_url(self, path: str) -> str:
        """
        Get URL to access file
        
        Args:
            path: Relative path to file
            
        Returns:
            Public URL or file path
        """
        pass
    
    @abstractmethod
    async def delete_file(self, path: str) -> bool:
        """
        Delete file from storage
        
        Args:
            path: Relative path to file
            
        Returns:
            True if successful
        """
        pass
    
    @abstractmethod
    async def file_exists(self, path: str) -> bool:
        """
        Check if file exists
        
        Args:
            path: Relative path to file
            
        Returns:
            True if file exists
        """
        pass
    
    @abstractmethod
    async def get_file(self, path: str) -> Optional[bytes]:
        """
        Get file contents
        
        Args:
            path: Relative path to file
            
        Returns:
            File contents as bytes or None
        """
        pass
