import os
import logging
import secrets
from typing import List, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Values that must never be used as a real signing key.
_INSECURE_SECRETS = {
    "",
    "your-secret-key-change-in-production",
    "your-super-secret-key-change-in-production",
    "your-super-secret-key-change-in-production-min-32-chars",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None if os.getenv("DATABASE_URL") else ".env",
        case_sensitive=True,
        extra="allow"
    )

    PROJECT_NAME: str = "Expense Tracker API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/v1"
    # "development" | "production" — governs SECRET_KEY strictness.
    ENVIRONMENT: str = "development"

    # No insecure default: a strong value must come from the environment.
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    # Short-lived, single-use tokens for email verification / password reset.
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/expense_tracker"

    FRONTEND_URL: str = "http://localhost:3000"
    # Streamlit admin origin (also allowed through CORS).
    ADMIN_URL: str = "http://localhost:8501"
    ANDROID_APP_URL: str = "expensetracker://"

    # Comma-separated extra CORS origins (FRONTEND_URL and ADMIN_URL always included).
    BACKEND_CORS_ORIGINS: str = ""

    # Comma-separated emails promoted to admin on startup.
    ADMIN_EMAILS: str = ""

    # Email / SMTP. When SMTP_HOST is unset the email service logs links to the
    # console instead of sending (keeps auth flows runnable with no infra).
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "noreply@expensetracker.com"

    SMS_PARSER_API_KEY: Optional[str] = None
    EMAIL_PARSER_API_KEY: Optional[str] = None

    @model_validator(mode="after")
    def _validate_secret(self) -> "Settings":
        key = (self.SECRET_KEY or "").strip()
        insecure = key in _INSECURE_SECRETS or len(key) < 32
        if insecure:
            if self.ENVIRONMENT == "production":
                raise RuntimeError(
                    "SECRET_KEY must be set to a strong (>=32 char) value in production. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )
            self.SECRET_KEY = secrets.token_urlsafe(32)
            logger.warning(
                "SECRET_KEY is unset or insecure; generated an ephemeral development key. "
                "Tokens are invalidated on every restart — set SECRET_KEY in .env for stable sessions."
            )
        if self.DATABASE_URL.startswith("postgresql://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

        return self

    @property
    def cors_origins(self) -> List[str]:
        origins = set()
        raw = (self.BACKEND_CORS_ORIGINS or "").strip()
        if raw:
            origins.update(o.strip() for o in raw.split(",") if o.strip())
        if self.FRONTEND_URL:
            origins.add(self.FRONTEND_URL)
        if self.ADMIN_URL:
            origins.add(self.ADMIN_URL)
        return sorted(origins)

    @property
    def admin_emails(self) -> List[str]:
        return [e.strip().lower() for e in (self.ADMIN_EMAILS or "").split(",") if e.strip()]

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.SMTP_HOST)


settings = Settings()
