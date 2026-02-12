"""
Diagnose registration issues
"""
import sys
import psycopg2
from backend.core.config import settings

print("=" * 60)
print("REGISTRATION DIAGNOSTICS")
print("=" * 60)

# 1. Check database connection
print("\n1. Testing database connection...")
try:
    # Parse DATABASE_URL
    db_url = settings.DATABASE_URL
    # postgresql://user:pass@host:port/dbname
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
    print("   ✓ Database connection successful")
    
    # 2. Check if users table exists
    print("\n2. Checking users table...")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    if columns:
        print(f"   ✓ Users table exists with {len(columns)} columns")
        
        # Check for MFA state column
        has_mfa_state = any(col[0] == 'mfa_state' for col in columns)
        if has_mfa_state:
            print("   ✓ mfa_state column exists")
        else:
            print("   ✗ WARNING: mfa_state column is MISSING!")
            print("   → Run: python run_mfa_migration.py")
    else:
        print("   ✗ Users table does NOT exist")
        print("   → Backend needs to create tables on startup")
    
    # 3. Check enum types
    print("\n3. Checking enum types...")
    cursor.execute("""
        SELECT typname FROM pg_type 
        WHERE typtype = 'e' AND typname IN ('mfastate', 'userrole');
    """)
    enums = cursor.fetchall()
    print(f"   Found {len(enums)} enum types: {[e[0] for e in enums]}")
    
    # 4. Check existing users count
    print("\n4. Checking existing users...")
    try:
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        print(f"   ✓ Current user count: {count}")
    except Exception as e:
        print(f"   ✗ Error querying users: {e}")
    
    conn.close()
    
except Exception as e:
    print(f"   ✗ Database error: {e}")
    sys.exit(1)

# 5. Test password validation
print("\n5. Testing password validation...")
from backend.schemas.auth import UserRegister
from pydantic import ValidationError

test_passwords = [
    ("TestPass123", "Missing special character"),
    ("TestPass123!", "Valid password"),
    ("test!", "Too short"),
    ("TestPassword!", "Valid password")
]

for pwd, expected in test_passwords:
    try:
        UserRegister(name="Test", email="test@obai.local", password=pwd)
        print(f"   ✓ '{pwd}' - ACCEPTED ({expected})")
    except ValidationError as e:
        error_msg = e.errors()[0]['msg']
        print(f"   ✗ '{pwd}' - REJECTED: {error_msg}")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("=" * 60)
print("\nCommon issues:")
print("1. Password needs: 8+ chars, uppercase, lowercase, number, special char")
print("2. If mfa_state column missing: run 'python run_mfa_migration.py'")
print("3. Check backend console for detailed error messages")
print("=" * 60)
