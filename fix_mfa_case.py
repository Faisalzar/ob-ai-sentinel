"""
Fix MFA state case mismatch in database
Converts lowercase enum values to uppercase
"""
import psycopg2
from backend.core.config import settings

print("=" * 60)
print("FIXING MFA STATE CASE MISMATCH")
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
    print("\n1. Checking current mfa_state values...")
    cursor.execute("""
        SELECT mfa_state, COUNT(*) 
        FROM users 
        GROUP BY mfa_state;
    """)
    current_values = cursor.fetchall()
    print("   Current values:")
    for val, count in current_values:
        print(f"   - '{val}': {count} users")
    
    print("\n2. Temporarily converting mfa_state column to TEXT...")
    cursor.execute("""
        ALTER TABLE users 
        ALTER COLUMN mfa_state TYPE TEXT;
    """)
    print("   ✓ Column converted to TEXT")
    
    print("\n3. Updating values to uppercase...")
    cursor.execute("""
        UPDATE users 
        SET mfa_state = UPPER(mfa_state);
    """)
    affected = cursor.rowcount
    print(f"   ✓ Updated {affected} rows")
    
    print("\n4. Dropping old enum type...")
    cursor.execute("""
        DROP TYPE IF EXISTS mfastate CASCADE;
    """)
    print("   ✓ Old enum type dropped")
    
    print("\n5. Creating new enum type with uppercase values...")
    cursor.execute("""
        CREATE TYPE mfastate AS ENUM ('DISABLED', 'SETUP_IN_PROGRESS', 'ENABLED');
    """)
    print("   ✓ New enum type created")
    
    print("\n6. Converting column back to enum type...")
    cursor.execute("""
        ALTER TABLE users 
        ALTER COLUMN mfa_state TYPE mfastate USING mfa_state::mfastate;
    """)
    print("   ✓ Column converted to enum")
    
    print("\n7. Setting default value...")
    cursor.execute("""
        ALTER TABLE users 
        ALTER COLUMN mfa_state SET DEFAULT 'DISABLED'::mfastate;
    """)
    print("   ✓ Default value set")
    
    print("\n8. Verifying final values...")
    cursor.execute("""
        SELECT mfa_state, COUNT(*) 
        FROM users 
        GROUP BY mfa_state;
    """)
    final_values = cursor.fetchall()
    print("   Final values:")
    for val, count in final_values:
        print(f"   - '{val}': {count} users")
    
    conn.commit()
    print("\n" + "=" * 60)
    print("✓ MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("\nNow update backend/models/models.py:")
    print("Change MFAState enum values to UPPERCASE:")
    print("  DISABLED = 'DISABLED'")
    print("  SETUP_IN_PROGRESS = 'SETUP_IN_PROGRESS'")
    print("  ENABLED = 'ENABLED'")
    print("=" * 60)
    
except Exception as e:
    conn.rollback()
    print(f"\n✗ ERROR: {e}")
    print("Migration rolled back")
finally:
    cursor.close()
    conn.close()
