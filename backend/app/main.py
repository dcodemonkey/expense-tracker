import logging

from fastapi import FastAPI, Request
from fastapi.responses import Response
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


# Single custom CORS middleware — no CORSMiddleware conflict
@app.middleware("http")
async def cors_handler(request: Request, call_next):
    origin = request.headers.get("origin", "*")

    # Immediately respond to all OPTIONS preflight requests
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            },
        )

    # Process all other requests and inject CORS headers into every response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
    return response


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/")
async def root():
    return {"message": "Expense Tracker API", "docs": "/docs"}
