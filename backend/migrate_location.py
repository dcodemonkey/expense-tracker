import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    print(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1]}")
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
        print("✅ Column 'location' added successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
