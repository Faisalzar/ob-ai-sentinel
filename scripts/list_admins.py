
import asyncio
from backend.db.base import SessionLocal
from backend.models.models import User, UserRole

async def list_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        print(f"Total Admins: {len(admins)}")
        print("-" * 30)
        for admin in admins:
            print(f"Name: {admin.name}")
            print(f"Email: {admin.email}")
            print("-" * 30)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(list_admins())
