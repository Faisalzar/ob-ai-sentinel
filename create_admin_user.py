import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory to path so module imports work
sys.path.append(os.getcwd())

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from backend.core.config import settings
    from backend.models.models import User, UserRole
    from backend.core.security import hash_password
except ImportError as e:
    logger.error(f"Import Error: {e}")
    logger.error("Make sure you are running this from the project root")
    sys.exit(1)

def create_admin():
    """Create or update admin user"""
    print(f"Connecting to database...")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return

    admins = [
        {"email": "zariwalafaisal@gmail.com", "password": "Sky@faisal3", "name": "Faisal Zariwala"},
        {"email": "obaisentinel@gmail.com", "password": "YouKnow@3me", "name": "System Admin"}
    ]

    for admin_data in admins:
        email = admin_data["email"]
        password = admin_data["password"]
        name = admin_data["name"]
        
        try:
            # Check if exists
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                logger.info(f"User {email} already exists.")
                
                # Ensure proper role and password
                updated = False
                if user.role != UserRole.ADMIN:
                     logger.info(f"Upgrading {email} to ADMIN role...")
                     user.role = UserRole.ADMIN
                     updated = True
                
                # Always reset password to ensure access with new credentials
                logger.info(f"Updating password for {email}...")
                user.password_hash = hash_password(password)
                updated = True
                
                if updated:
                    db.commit()
                    logger.info(f"User {email} updated successfully.")
                    
            else:
                logger.info(f"Creating new admin user {email}...")
                user = User(
                    email=email,
                    name=name,
                    password_hash=hash_password(password),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.commit()
                logger.info(f"Admin user {email} created successfully!")
                
        except Exception as e:
            logger.error(f"Error processing {email}: {e}")
            db.rollback()
            
    print("\n" + "="*30)
    print("ADMINS CONFIGURED")
    print("="*30)
    for admin in admins:
        print(f"Email: {admin['email']}")
    print("="*30 + "\n")
    
    db.close()

if __name__ == "__main__":
    create_admin()
