"""Shared slowapi limiter, keyed by client IP."""
import os
from slowapi import Limiter
from starlette.requests import Request


def _get_remote_address(request: Request) -> str:
    """Return client IP, safely handling serverless environments where request.client is None."""
    forwarded_for = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if getattr(request, "client", None) and getattr(request.client, "host", None):
        return request.client.host
    return "127.0.0.1"


# Disable slowapi in Vercel serverless environment to prevent NoneType client crashes
enabled = not bool(os.getenv("VERCEL"))
limiter = Limiter(key_func=_get_remote_address, enabled=enabled)
