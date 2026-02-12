import logging
from sqlalchemy import create_engine, text
from backend.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """
    Add password_reset_otp column to users table
    """
    logger.info("Starting migration: Add password_reset_otp to users table")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='password_reset_otp'"
            ))
            
            if result.fetchone():
                logger.info("Column password_reset_otp already exists. Skipping.")
            else:
                logger.info("Adding password_reset_otp column...")
                connection.execute(text("ALTER TABLE users ADD COLUMN password_reset_otp VARCHAR(6)"))
                connection.commit()
                logger.info("Migration successful!")
                
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
