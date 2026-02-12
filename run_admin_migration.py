import sqlalchemy
from sqlalchemy import create_engine, text
from backend.core.config import settings

def migrate_admin_dashboard():
    print(f"Running migration for Admin Dashboard features...")
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # 1. Create alertstatus enum type
            try:
                conn.execute(text("CREATE TYPE alertstatus AS ENUM ('new', 'reviewed', 'acknowledged')"))
                print("✅ Created alertstatus enum type")
            except Exception as e:
                print(f"⚠️  Enum type alertstatus may already exist: {e}")
                
            # 2. Add columns to alerts table
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN status alertstatus DEFAULT 'new'"))
                print("✅ Added status column to alerts")
            except Exception as e:
                 print(f"⚠️  Column status may already exist: {e}")

            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN admin_notes TEXT"))
                print("✅ Added admin_notes column to alerts")
            except Exception as e:
                 print(f"⚠️  Column admin_notes may already exist: {e}")

            # 3. Create system_settings table
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_settings (
                        id SERIAL PRIMARY KEY,
                        primary_engine VARCHAR(50) DEFAULT 'roboflow',
                        fallback_engine VARCHAR(50) DEFAULT 'yolov8',
                        detection_timeout INTEGER DEFAULT 30,
                        min_confidence INTEGER DEFAULT 40,
                        
                        max_file_size_mb INTEGER DEFAULT 10,
                        allowed_file_types JSONB DEFAULT '["image/jpeg", "image/png", "video/mp4"]',
                        
                        otp_expiry_minutes INTEGER DEFAULT 10,
                        max_login_attempts INTEGER DEFAULT 5,
                        mfa_enforced_for_admins BOOLEAN DEFAULT FALSE,
                        
                        maintenance_mode BOOLEAN DEFAULT FALSE,
                        
                        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
                        updated_by UUID REFERENCES users(id)
                    )
                """))
                print("✅ Created system_settings table")
                
                # Check if default row exists
                res = conn.execute(text("SELECT id FROM system_settings WHERE id = 1"))
                if not res.fetchone():
                    conn.execute(text("INSERT INTO system_settings (id) VALUES (1)"))
                    print("✅ Inserted default system settings")
                    
            except Exception as e:
                print(f"❌ Error creating system_settings: {e}")
            
            conn.commit()
            print("🚀 Admin Dashboard migration complete!")
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate_admin_dashboard()
