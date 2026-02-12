"""
Test SMTP email sending
"""
import asyncio
import sys
from backend.services.email_service import email_service

async def test_email():
    print("Testing SMTP connection and email sending...")
    print("-" * 60)
    
    test_email = "faisalzar0308@gmail.com"
    test_otp = "123456"
    
    print(f"Attempting to send test OTP to: {test_email}")
    print(f"Test OTP code: {test_otp}")
    print("-" * 60)
    
    try:
        result = await email_service.send_email_otp(
            test_email,
            "Test User",
            test_otp,
            10
        )
        
        if result:
            print("\n✅ SUCCESS! Email sent successfully!")
            print(f"Check {test_email} inbox (and spam folder)")
        else:
            print("\n❌ FAILED! Email was not sent.")
            print("Check backend logs above for error details.")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    print("-" * 60)

if __name__ == "__main__":
    asyncio.run(test_email())
