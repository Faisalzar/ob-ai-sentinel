"""
Migration script to split max_file_size_mb into image/video limits
"""
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.db.base import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Starting database migration for SystemSettings...")
        
        # Check if new columns exist
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'system_settings'"))
        columns = [row[0] for row in result]
        
        if 'max_image_size_mb' not in columns:
            print("Adding max_image_size_mb column...")
            db.execute(text("ALTER TABLE system_settings ADD COLUMN max_image_size_mb INTEGER DEFAULT 5"))
        
        if 'max_video_size_mb' not in columns:
            print("Adding max_video_size_mb column...")
            db.execute(text("ALTER TABLE system_settings ADD COLUMN max_video_size_mb INTEGER DEFAULT 50"))
            
        # Migrate data from old column if it exists
        if 'max_file_size_mb' in columns:
            print("Migrating data from max_file_size_mb to max_image_size_mb...")
            db.execute(text("UPDATE system_settings SET max_image_size_mb = max_file_size_mb"))
            print("Dropping old max_file_size_mb column...")
            db.execute(text("ALTER TABLE system_settings DROP COLUMN max_file_size_mb"))
            
        db.commit()
        print("Migration completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
