"""
Disable MFA for a specific user
"""
import psycopg2
from backend.core.config import settings

EMAIL = "owais@gmail.com"  # Change this if needed

print(f"Disabling MFA for {EMAIL}...")

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
cursor = conn.cursor()

try:
    # Check current state
    cursor.execute("SELECT mfa_state FROM users WHERE email = %s;", (EMAIL,))
    result = cursor.fetchone()
    
    if not result:
        print(f"❌ User {EMAIL} not found!")
    else:
        current_state = result[0]
        print(f"Current MFA state: {current_state}")
        
        # Disable MFA
        cursor.execute("""
            UPDATE users 
            SET mfa_state = 'DISABLED',
                mfa_secret_encrypted = NULL,
                mfa_secret_temporary = NULL,
                backup_codes_encrypted = NULL
            WHERE email = %s;
        """, (EMAIL,))
        
        conn.commit()
        print(f"✅ MFA disabled for {EMAIL}")
        print("\nNow:")
        print("1. Log out (clear localStorage: localStorage.clear())")
        print("2. Log in again - you'll skip MFA this time")
        
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
