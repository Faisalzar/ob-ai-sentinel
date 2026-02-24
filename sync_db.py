import os
import sys

# Add the project root to the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.db.base import engine
from backend.models.models import Base

print("Syncing DB tables...")
Base.metadata.create_all(bind=engine)
print("Sync complete.")
