import asyncio
import bcrypt
from app.core.database import async_session_maker
from app.models import User
from sqlalchemy import select

def hash_pass(password: str) -> str:
    return bcrypt.hashpw(password[:72].encode(), bcrypt.gensalt(12)).decode()

async def main():
    async with async_session_maker() as session:
        res = await session.execute(select(User))
        users = res.scalars().all()
        new_hash = hash_pass("12345678")
        for u in users:
            u.hashed_password = new_hash
            u.is_active = True
            u.role = "admin"
        await session.commit()
        print(f"SUCCESS: Reset password to 12345678 for {len(users)} user(s)")

if __name__ == "__main__":
    asyncio.run(main())
