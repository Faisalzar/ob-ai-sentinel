import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from alembic.config import Config
from alembic import command

def run_migration():
    alembic_cfg = Config("alembic.ini")
    command.revision(alembic_cfg, autogenerate=True, message="add_notifications_table")

if __name__ == "__main__":
    run_migration()
