
import asyncio
import logging
from backend.services.email_service import email_service
from backend.core.config import settings

# Configure logging to show debug info
logging.basicConfig(level=logging.DEBUG)

async def test_email():
    print(f"Attempting to send email from: {settings.FROM_EMAIL}")
    print(f"Using SMTP Server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USER}")
    
    try:
        success = await email_service.send_email(
            to_email="zariwalafaisal@gmail.com",
            subject="Test Email from AI Sentinel",
            html_content="<h1>It Works!</h1><p>This is a test email to verify SMTP settings.</p>"
        )
        
        if success:
            print("\n✅ Email sent successfully!")
        else:
            print("\n❌ Email failed to send. Check logs above for details.")
            
    except Exception as e:
        print(f"\n❌ Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
