"""
Email Service - Send transactional emails
Supports: verification, password reset, alerts, MFA setup
"""
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import aiosmtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader, select_autoescape

from backend.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending transactional emails"""
    
    def __init__(self):
        """Initialize email service with templates"""
        # Setup Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        logger.info("Email service initialized")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text fallback (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """

        try:
            # OPTION 1: Use Brevo API (HTTP) if Key is present
            if settings.BREVO_API_KEY:
                async with httpx.AsyncClient() as client:
                    payload = {
                        "sender": {"name": settings.FROM_NAME, "email": settings.FROM_EMAIL},
                        "to": [{"email": to_email}],
                        "subject": subject,
                        "htmlContent": html_content
                    }
                    if text_content:
                        payload["textContent"] = text_content
                        
                    response = await client.post(
                        "https://api.brevo.com/v3/smtp/email",
                        headers={
                            "accept": "application/json",
                            "api-key": settings.BREVO_API_KEY,
                            "content-type": "application/json"
                        },
                        json=payload,
                        timeout=10.0
                    )
                    
                    if response.status_code in [200, 201, 202]:
                        logger.info(f"Email sent via Brevo API to {to_email}")
                        return True
                    else:
                        logger.error(f"Brevo API failed: {response.text}")
                        # Fallback to SMTP or return False? Let's return False for now to see logs
                        return False

            # OPTION 2: Use SMTP (Legacy/Local)
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add text version if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Determine TLS settings based on port
            use_tls = settings.SMTP_PORT == 465
            start_tls = settings.SMTP_PORT == 587

            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=use_tls,    # Implicit TLS for 465
                start_tls=start_tls # STARTTLS for 587
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    async def send_verification_email(
        self,
        to_email: str,
        user_name: str,
        verification_token: str
    ) -> bool:
        """
        Send email verification link
        
        Args:
            to_email: User email
            user_name: User's name
            verification_token: Verification token
            
        Returns:
            True if sent successfully
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        try:
            template = self.env.get_template("verification_email.html")
            html_content = template.render(
                user_name=user_name,
                verification_url=verification_url,
                app_name=settings.APP_NAME
            )
            
            subject = f"Verify Your {settings.APP_NAME} Account"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return False
    
    async def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_token: str
    ) -> bool:
        """
        Send password reset link
        
        Args:
            to_email: User email
            user_name: User's name
            reset_token: Password reset token
            
        Returns:
            True if sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        try:
            template = self.env.get_template("password_reset.html")
            html_content = template.render(
                user_name=user_name,
                reset_url=reset_url,
                app_name=settings.APP_NAME,
                expiry_hours=1  # Token valid for 1 hour
            )
            
            subject = f"Reset Your {settings.APP_NAME} Password"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return False
    
    async def send_mfa_setup_email(
        self,
        to_email: str,
        user_name: str,
        backup_codes: List[str]
    ) -> bool:
        """
        Send MFA backup codes
        
        Args:
            to_email: User email
            user_name: User's name
            backup_codes: List of backup codes
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("mfa_setup.html")
            html_content = template.render(
                user_name=user_name,
                backup_codes=backup_codes,
                app_name=settings.APP_NAME
            )
            
            subject = f"Your {settings.APP_NAME} MFA Backup Codes"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send MFA setup email: {e}")
            return False
    
    async def send_alert_notification(
        self,
        to_email: str,
        user_name: str,
        alert_details: Dict[str, Any]
    ) -> bool:
        """
        Send dangerous object detection alert
        
        Args:
            to_email: User email
            user_name: User's name
            alert_details: Alert information
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("alert_notification.html")
            html_content = template.render(
                user_name=user_name,
                object_name=alert_details.get("object_name"),
                confidence=alert_details.get("confidence"),
                timestamp=alert_details.get("timestamp"),
                filename=alert_details.get("filename"),
                app_name=settings.APP_NAME
            )
            
            subject = f"⚠️ ALERT: {alert_details.get('object_name')} Detected"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send alert notification: {e}")
            return False
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str
    ) -> bool:
        """
        Send welcome email after successful registration
        
        Args:
            to_email: User email
            user_name: User's name
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("welcome_email.html")
            html_content = template.render(
                user_name=user_name,
                app_name=settings.APP_NAME,
                docs_url=f"{settings.FRONTEND_URL}/login"
            )
            
            subject = f"Welcome to {settings.APP_NAME}!"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
            return False
    
    async def send_email_otp(
        self,
        to_email: str,
        user_name: str,
        otp_code: str,
        expiry_minutes: int = 10
    ) -> bool:
        """
        Send email OTP verification code
        
        Args:
            to_email: User email
            user_name: User's name
            otp_code: 6-digit OTP code
            expiry_minutes: How long the code is valid (default 10 minutes)
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("email_otp.html")
            html_content = template.render(
                user_name=user_name,
                otp_code=otp_code,
                expiry_minutes=expiry_minutes,
                app_name=settings.APP_NAME
            )
            
            subject = f"Your {settings.APP_NAME} Verification Code: {otp_code}"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send email OTP: {e}")
            return False
            
    async def send_mfa_recovery_email(
        self,
        to_email: str,
        user_name: str,
        otp_code: str,
        expiry_minutes: int = 10
    ) -> bool:
        """
        Send MFA recovery OTP
        
        Args:
            to_email: User email
            user_name: User's name
            otp_code: Recovery OTP code
            expiry_minutes: Validity duration
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("email_otp.html")
            html_content = template.render(
                user_name=user_name,
                otp_code=otp_code,
                expiry_minutes=expiry_minutes,
                app_name=settings.APP_NAME,
                is_recovery=True
            )
            
            subject = f"{settings.APP_NAME} Account Recovery Code: {otp_code}"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send MFA recovery email: {e}")
            return False

    async def send_password_reset_otp(
        self,
        to_email: str,
        user_name: str,
        otp_code: str,
        expiry_minutes: int = 10
    ) -> bool:
        """
        Send Password Reset OTP
        
        Args:
            to_email: User email
            user_name: User's name
            otp_code: OTP code
            expiry_minutes: Validity duration
            
        Returns:
            True if sent successfully
        """
        try:
            template = self.env.get_template("email_otp.html")
            html_content = template.render(
                user_name=user_name,
                otp_code=otp_code,
                expiry_minutes=expiry_minutes,
                app_name=settings.APP_NAME,
                is_password_reset=True
            )
            
            subject = f"{settings.APP_NAME} Password Reset Code: {otp_code}"
            
            return await self.send_email(to_email, subject, html_content)
            
            
        except Exception as e:
            logger.error(f"Failed to send password reset OTP: {e}")
            return False

    async def send_security_policy_notification(
        self,
        to_email: str,
        user_name: str,
        action_description: str,
        modified_by: str
    ) -> bool:
        """
        Send notification when security policies are modified
        """
        try:
            template = self.env.get_template("security_notification.html")
            html_content = template.render(
                user_name=user_name,
                action_description=action_description,
                modified_by=modified_by,
                timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                dashboard_url=f"{settings.FRONTEND_URL}/admin/settings",
                app_name=settings.APP_NAME
            )
            
            subject = f"🛡️ SECURITY ALERT: System Policy Changed"
            
            return await self.send_email(to_email, subject, html_content)
            
        except Exception as e:
            logger.error(f"Failed to send security notification: {e}")
            return False

    async def send_contact_email(
        self, 
        name: str, 
        email: str, 
        subject: str, 
        message: str, 
        organization: Optional[str] = None
    ) -> bool:
        """
        Send contact form submission to admin
        
        Args:
            name: Sender name
            email: Sender email
            subject: Email subject
            message: Message content
            organization: Sender organization (optional)
            
        Returns:
            True if sent successfully
        """
        # Admin email to receive notifications
        # In a real app, this might be configured separately or be a list of admins
        admin_email = ["zariwalafaisal@gmail.com", "obaisentinel@gmail.com"]
        
        try:
            template = self.env.get_template("contact_notification.html")
            html_content = template.render(
                name=name,
                email=email,
                subject=subject,
                message=message,
                organization=organization,
                app_name=settings.APP_NAME
            )
            
            email_subject = f"[{settings.APP_NAME}] Contact: {subject}"
            
            # Send to all admins
            success = True
            for admin in admin_email:
                if not await self.send_email(admin, email_subject, html_content):
                    success = False
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to send contact email: {e}")
            return False



# Global email service instance
email_service = EmailService()
