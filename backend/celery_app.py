"""
Celery Application for Background Tasks
Handles async video processing and other long-running tasks
"""
from celery import Celery
from backend.core.config import settings

# Create Celery app
celery_app = Celery(
    "ai_detection_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Auto-discover tasks
celery_app.autodiscover_tasks(['backend.tasks'])
