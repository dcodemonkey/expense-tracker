"""Shared slowapi limiter, keyed by client IP."""
from slowapi import Limiter
from starlette.requests import Request


def _get_remote_address(request: Request) -> str:
    """Return client IP, falling back to 'unknown' when running behind a proxy
    (e.g. Vite dev-server) that doesn't forward client metadata."""
    if request.client and request.client.host:
        return request.client.host
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return "unknown"


limiter = Limiter(key_func=_get_remote_address)
