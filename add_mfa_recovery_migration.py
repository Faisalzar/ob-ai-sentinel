
from sqlalchemy import create_engine, text
import os
import sys

# Add directory to path
sys.path.append(os.getcwd())

from backend.core.config import settings

def run_migration():
    print("Running migration to add MFA recovery columns...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        conn.execute(text("COMMIT"))
        
        # Check if columns exist
        try:
            conn.execute(text("SELECT mfa_recovery_otp FROM users LIMIT 1"))
            print("Columns already exist.")
        except Exception:
            print("Adding mfa_recovery_otp column...")
            conn.execute(text("COMMIT"))
            conn.execute(text("ALTER TABLE users ADD COLUMN mfa_recovery_otp VARCHAR(6)"))
            
        try:
            conn.execute(text("SELECT mfa_recovery_expires FROM users LIMIT 1"))
        except Exception:
            print("Adding mfa_recovery_expires column...")
            conn.execute(text("COMMIT"))
            conn.execute(text("ALTER TABLE users ADD COLUMN mfa_recovery_expires TIMESTAMP"))
            
        print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
