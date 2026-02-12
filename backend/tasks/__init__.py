"""
Celery Tasks Module
"""
from backend.tasks.detection_tasks import process_video_async
from backend.tasks.email_tasks import send_email_async

__all__ = ['process_video_async', 'send_email_async']
