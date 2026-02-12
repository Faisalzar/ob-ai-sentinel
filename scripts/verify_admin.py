
import asyncio
from backend.db.base import SessionLocal
from backend.models.models import User, UserRole

async def verify_admin():
    db = SessionLocal()
    try:
        email = "obaisentinel@gmail.com"
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User found: {user.email}")
            print(f"Role: {user.role}")
            print(f"Is Active: {user.is_active}")
            if user.role == UserRole.ADMIN:
                print("SUCCESS: User is an ADMIN.")
            else:
                print("FAILURE: User is NOT an ADMIN.")
        else:
            print("FAILURE: User not found.")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(verify_admin())
