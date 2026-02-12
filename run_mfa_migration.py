"""
Run MFA State Migration
Adds mfa_state and mfa_secret_temporary columns to users table
"""
import psycopg2
from backend.core.config import settings

def run_migration():
    """Run the MFA state migration"""
    # Extract connection parameters from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    db_url = settings.DATABASE_URL
    
    try:
        # Connect to database
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Starting MFA state migration...\n")
        
        # 1. Check and recreate enum type if needed
        print("1. Checking mfastate enum type...")
        try:
            # Drop existing enum if it exists
            cursor.execute("DROP TYPE IF EXISTS mfastate CASCADE;")
            # Create new enum with correct values
            cursor.execute("CREATE TYPE mfastate AS ENUM ('disabled', 'setup_in_progress', 'enabled');")
            conn.commit()
            print("   ✓ mfastate enum created")
        except Exception as e:
            print(f"   ⚠ Error with enum: {e}")
            conn.rollback()
        
        # 2. Add mfa_state column
        print("\n2. Adding mfa_state column...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN mfa_state mfastate DEFAULT 'disabled';")
            print("   ✓ mfa_state column added")
        except psycopg2.errors.DuplicateColumn:
            print("   ⚠ mfa_state column already exists, skipping")
            conn.rollback()
        
        # 3. Add mfa_secret_temporary column
        print("\n3. Adding mfa_secret_temporary column...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN mfa_secret_temporary TEXT;")
            print("   ✓ mfa_secret_temporary column added")
        except psycopg2.errors.DuplicateColumn:
            print("   ⚠ mfa_secret_temporary column already exists, skipping")
            conn.rollback()
        
        # 4. Migrate existing data
        print("\n4. Migrating existing data...")
        cursor.execute("""
            UPDATE users 
            SET mfa_state = CASE 
                WHEN mfa_enabled = true THEN 'enabled'::mfastate
                ELSE 'disabled'::mfastate
            END
            WHERE mfa_state IS NULL OR mfa_state = 'disabled';
        """)
        rows_updated = cursor.rowcount
        print(f"   ✓ Migrated {rows_updated} users")
        
        # 5. Make mfa_state NOT NULL
        print("\n5. Setting mfa_state as NOT NULL...")
        try:
            cursor.execute("ALTER TABLE users ALTER COLUMN mfa_state SET NOT NULL;")
            print("   ✓ mfa_state is now NOT NULL")
        except:
            print("   ⚠ mfa_state already NOT NULL, skipping")
            conn.rollback()
        
        # 6. Verify migration
        print("\n6. Verifying migration...")
        cursor.execute("""
            SELECT COUNT(*) as total_users, 
                   SUM(CASE WHEN mfa_state = 'enabled' THEN 1 ELSE 0 END) as mfa_enabled_count,
                   SUM(CASE WHEN mfa_state = 'disabled' THEN 1 ELSE 0 END) as mfa_disabled_count,
                   SUM(CASE WHEN mfa_state = 'setup_in_progress' THEN 1 ELSE 0 END) as mfa_setup_count
            FROM users;
        """)
        total, enabled, disabled, setup = cursor.fetchone()
        
        print(f"   ✓ Total users: {total}")
        print(f"   ✓ MFA enabled: {enabled}")
        print(f"   ✓ MFA disabled: {disabled}")
        print(f"   ✓ MFA setup in progress: {setup}")
        
        # Commit all changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Display sample data
        print("\n7. Sample of migrated data:")
        cursor.execute("SELECT id, email, mfa_enabled, mfa_state FROM users LIMIT 5;")
        rows = cursor.fetchall()
        for row in rows:
            print(f"   {row[1]}: mfa_enabled={row[2]}, mfa_state={row[3]}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Database migration complete! You can now restart the backend server.")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        if conn:
            conn.rollback()
        raise

if __name__ == "__main__":
    run_migration()
