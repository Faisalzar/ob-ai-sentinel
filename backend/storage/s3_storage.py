"""
AWS S3 storage implementation
"""
from typing import Optional, BinaryIO
import boto3
from botocore.client import Config
from backend.storage.base import StorageInterface
from backend.core.config import settings
import uuid


class S3Storage(StorageInterface):
    """AWS S3 storage handler"""

    def __init__(self):
        self.bucket = settings.AWS_BUCKET_NAME
        self.region = settings.AWS_REGION
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY,
            aws_secret_access_key=settings.AWS_SECRET_KEY,
            region_name=self.region,
            config=Config(signature_version='s3v4')
        )

    async def save_file(self, file: BinaryIO, path: str) -> str:
        key = path.replace('\\', '/')
        body = file.read() if hasattr(file, 'read') else file
        self.client.put_object(Bucket=self.bucket, Key=key, Body=body, ACL='private')
        return f"s3://{self.bucket}/{key}"

    async def get_file_url(self, path: str) -> str:
        key = path.replace('\\', '/')
        url = self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=3600
        )
        return url

    async def delete_file(self, path: str) -> bool:
        key = path.replace('\\', '/')
        self.client.delete_object(Bucket=self.bucket, Key=key)
        return True

    async def file_exists(self, path: str) -> bool:
        key = path.replace('\\', '/')
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except self.client.exceptions.NoSuchKey:
            return False

    async def get_file(self, path: str) -> Optional[bytes]:
        key = path.replace('\\', '/')
        obj = self.client.get_object(Bucket=self.bucket, Key=key)
        return obj['Body'].read()
