
import asyncio
import logging
from backend.db.base import SessionLocal
from backend.models.models import User, UserRole
from backend.core.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_admin():
    db = SessionLocal()
    try:
        email = "obaisentinel@gmail.com"
        password = "YouKnow@3me"
        
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            logger.info(f"User {email} already exists. Updating to ADMIN role and checking password...")
            existing_user.role = UserRole.ADMIN
            # We don't overwrite password if they already exist unless explicitly asked, 
            # but here the requirement implies setting this specific password for this specific user.
            existing_user.password_hash = hash_password(password)
            existing_user.is_active = True
            existing_user.is_verified = True
            db.commit()
            logger.info(f"Updated {email} to ADMIN with new password.")
        else:
            new_user = User(
                name="Sentinel Admin",  # Default name
                email=email,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(new_user)
            db.commit()
            logger.info(f"Created new ADMIN user: {email}")
            
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
