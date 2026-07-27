import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import update, func

from app.core.config import settings
from app.core.database import init_db, async_session_maker
from app.core.ratelimit import limiter
from app.api.v1.api import api_router
from app.models import User, UserRole

logger = logging.getLogger(__name__)


async def _promote_admins() -> None:
    """Promote configured ADMIN_EMAILS to the admin role on startup."""
    if not settings.admin_emails:
        return
    async with async_session_maker() as db:
        result = await db.execute(
            update(User)
            .where(func.lower(User.email).in_(settings.admin_emails))
            .values(role=UserRole.ADMIN)
            .execution_options(synchronize_session=False)
        )
        await db.commit()
        if result.rowcount:
            logger.info("Promoted %d user(s) to admin", result.rowcount)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _promote_admins()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/")
async def root():
    return {"message": "Expense Tracker API", "docs": "/docs"}
