"""
Email Celery Tasks
Async email sending
"""
import logging
from typing import Dict, Any
import asyncio

from backend.celery_app import celery_app
from backend.services.email_service import email_service

logger = logging.getLogger(__name__)


@celery_app.task(name="send_email_async")
def send_email_async(email_type: str, to_email: str, **kwargs):
    """
    Send email asynchronously
    
    Args:
        email_type: Type of email (welcome, alert, mfa, password_reset)
        to_email: Recipient email
        **kwargs: Additional parameters for the email
        
    Returns:
        Success status
    """
    try:
        # Run async email function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if email_type == "welcome":
            result = loop.run_until_complete(
                email_service.send_welcome_email(
                    to_email,
                    kwargs.get("user_name", "User")
                )
            )
        elif email_type == "alert":
            result = loop.run_until_complete(
                email_service.send_alert_notification(
                    to_email,
                    kwargs.get("user_name", "User"),
                    kwargs.get("alert_details", {})
                )
            )
        elif email_type == "mfa":
            result = loop.run_until_complete(
                email_service.send_mfa_setup_email(
                    to_email,
                    kwargs.get("user_name", "User"),
                    kwargs.get("backup_codes", [])
                )
            )
        elif email_type == "password_reset":
            result = loop.run_until_complete(
                email_service.send_password_reset_email(
                    to_email,
                    kwargs.get("user_name", "User"),
                    kwargs.get("reset_token", "")
                )
            )
        else:
            raise ValueError(f"Unknown email type: {email_type}")
        
        loop.close()
        
        logger.info(f"Email sent successfully: {email_type} to {to_email}")
        return {"status": "sent", "email_type": email_type}
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise
