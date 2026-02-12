-- Add MFA State columns to users table
-- Run this with: psql -U postgres -d ai_detection -f add_mfa_state_migration.sql

-- Create MFAState enum type
CREATE TYPE mfastate AS ENUM ('disabled', 'setup_in_progress', 'enabled');

-- Add new columns
ALTER TABLE users ADD COLUMN mfa_state mfastate DEFAULT 'disabled';
ALTER TABLE users ADD COLUMN mfa_secret_temporary TEXT;

-- Migrate existing data: set mfa_state based on mfa_enabled
UPDATE users 
SET mfa_state = CASE 
    WHEN mfa_enabled = true THEN 'enabled'::mfastate
    ELSE 'disabled'::mfastate
END;

-- Make mfa_state NOT NULL
ALTER TABLE users ALTER COLUMN mfa_state SET NOT NULL;

-- Verify migration
SELECT COUNT(*) as total_users, 
       SUM(CASE WHEN mfa_state = 'enabled' THEN 1 ELSE 0 END) as mfa_enabled_count,
       SUM(CASE WHEN mfa_state = 'disabled' THEN 1 ELSE 0 END) as mfa_disabled_count
FROM users;

-- Display sample of migrated data
SELECT id, email, mfa_enabled, mfa_state FROM users LIMIT 5;
