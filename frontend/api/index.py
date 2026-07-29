import os
import sys

# The 'backend' folder is two levels up from 'frontend/api/'
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.main import app

# ASGI middleware to restore the original path forwarded by Vercel
class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            
            # Vercel passes the original URL path in these headers
            original_path = headers.get(b"x-vercel-forwarded-path", b"").decode("utf-8")
            if not original_path:
                original_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            
            if original_path:
                scope["path"] = original_path
                query_string = scope.get("query_string", b"").decode("utf-8")
                raw_path_with_query = original_path
                if query_string:
                    raw_path_with_query += f"?{query_string}"
                scope["raw_path"] = raw_path_with_query.encode("utf-8")

        return await self.asgi_app(scope, receive, send)

handler = VercelPathMiddleware(app)
app = handler
