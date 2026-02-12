"""
Initialize PostgreSQL Database
Creates all tables and migrates from SQLite if needed
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

from backend.db.base import engine
from backend.models.models import Base

def init_postgres():
    """Initialize PostgreSQL database with all tables"""
    print("🔄 Initializing PostgreSQL database...")
    print(f"📊 Creating tables in: {os.getenv('DATABASE_URL')}")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\n📋 Created {len(tables)} tables:")
        for table in tables:
            print(f"   ✓ {table}")
        
        print("\n🎉 PostgreSQL database initialized successfully!")
        print("🚀 You can now start your application with: python main.py")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    init_postgres()
