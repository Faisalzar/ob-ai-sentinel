"""add_mfa_state

Revision ID: 002
Revises: 001
Create Date: 2026-01-23

Add MFA state management columns to users table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Create MFAState enum type
    mfa_state_enum = postgresql.ENUM('disabled', 'setup_in_progress', 'enabled', name='mfastate')
    mfa_state_enum.create(op.get_bind(), checkfirst=True)
    
    # Add new columns
    op.add_column('users', sa.Column('mfa_state', sa.Enum('disabled', 'setup_in_progress', 'enabled', name='mfastate'), nullable=True))
    op.add_column('users', sa.Column('mfa_secret_temporary', sa.Text(), nullable=True))
    
    # Migrate existing data: set mfa_state based on mfa_enabled
    op.execute("""
        UPDATE users 
        SET mfa_state = CASE 
            WHEN mfa_enabled = true THEN 'enabled'::mfastate
            ELSE 'disabled'::mfastate
        END
        WHERE mfa_state IS NULL
    """)
    
    # Make mfa_state NOT NULL after migration
    op.alter_column('users', 'mfa_state', nullable=False)


def downgrade():
    # Remove new columns
    op.drop_column('users', 'mfa_secret_temporary')
    op.drop_column('users', 'mfa_state')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS mfastate')
