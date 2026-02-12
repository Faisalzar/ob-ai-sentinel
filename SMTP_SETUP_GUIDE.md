# SMTP Setup Guide for Email OTP

## Option 1: Gmail (Recommended for Development)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Windows Computer** (or Other) as the device
4. Click **Generate**
5. **Copy the 16-character password**

### Step 3: Update .env file
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password  # Without spaces
FROM_EMAIL=your-email@gmail.com
FROM_NAME=AI Object Detection System
```

## Option 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
FROM_NAME=AI Object Detection System
```

## Option 3: Custom SMTP Server

If you have your own SMTP server:

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=AI Object Detection System
```

## Testing SMTP Configuration

After updating .env, restart the backend and test with this script:

```bash
.\.venv311_new\Scripts\python.exe -c "
import asyncio
from backend.services.email_service import email_service

async def test():
    result = await email_service.send_email_otp(
        'your-test-email@gmail.com',
        'Test User',
        '123456',
        10
    )
    print('Email sent:', result)

asyncio.run(test())
"
```

## Important Notes

- **Gmail**: Must use App Password (not your regular password)
- **Port 587**: TLS/STARTTLS (recommended)
- **Port 465**: SSL (older, but works)
- **Firewall**: Make sure outbound connections on these ports are allowed
- **Rate Limits**: Gmail has sending limits (500 emails/day for free accounts)

## Troubleshooting

### Error: "Authentication failed"
- Double-check SMTP_USER and SMTP_PASSWORD
- Gmail: Make sure you're using an App Password, not your regular password
- Outlook: May need to enable "less secure apps"

### Error: "Connection timeout"
- Check if firewall is blocking SMTP ports
- Try port 465 instead of 587
- Check if your ISP blocks SMTP

### Error: "SSL/TLS handshake failed"
- Update your Python SSL certificates
- Try a different SMTP port

## Production Recommendations

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, high volume)
- **Postmark** (reliable, fast delivery)

These services provide better deliverability and analytics.
