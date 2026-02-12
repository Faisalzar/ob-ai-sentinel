"""
Add email OTP columns to users table
"""
import psycopg2
from backend.core.config import settings

print("=" * 60)
print("ADDING EMAIL OTP COLUMNS TO USERS TABLE")
print("=" * 60)

# Parse DATABASE_URL
db_url = settings.DATABASE_URL
parts = db_url.replace("postgresql://", "").split("@")
user_pass = parts[0].split(":")
host_db = parts[1].split("/")
host_port = host_db[0].split(":")

conn = psycopg2.connect(
    dbname=host_db[1],
    user=user_pass[0],
    password=user_pass[1],
    host=host_port[0],
    port=host_port[1] if len(host_port) > 1 else "5432"
)
conn.autocommit = False
cursor = conn.cursor()

try:
    print("\n1. Checking if columns already exist...")
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('email_otp_code', 'email_otp_expires');
    """)
    existing = [row[0] for row in cursor.fetchall()]
    
    if 'email_otp_code' in existing:
        print("   ⚠ email_otp_code already exists")
    else:
        print("   Adding email_otp_code column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN email_otp_code VARCHAR(6) NULL;
        """)
        print("   ✓ Added email_otp_code")
    
    if 'email_otp_expires' in existing:
        print("   ⚠ email_otp_expires already exists")
    else:
        print("   Adding email_otp_expires column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN email_otp_expires TIMESTAMP NULL;
        """)
        print("   ✓ Added email_otp_expires")
    
    conn.commit()
    print("\n" + "=" * 60)
    print("✓ MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 60)
    
except Exception as e:
    conn.rollback()
    print(f"\n✗ ERROR: {e}")
    print("Migration rolled back")
finally:
    cursor.close()
    conn.close()
