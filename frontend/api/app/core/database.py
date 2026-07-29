from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    import app.models  # noqa: F401 - Loads models into Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_location VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_latitude NUMERIC(10, 7);"))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verified_longitude NUMERIC(10, 7);"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMPTZ;"))