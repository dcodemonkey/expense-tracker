import os
import sys

# Ensure the directory containing the 'app' module is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

# ASGI middleware to restore the original path forwarded by Vercel
class VercelPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            
            # Extract original request path from Vercel headers
            original_path = headers.get(b"x-vercel-forwarded-path", b"").decode("utf-8")
            if not original_path:
                original_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            
            if original_path:
                # Strip query string if present in path string
                clean_path = original_path.split("?")[0]
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("utf-8")

        return await self.asgi_app(scope, receive, send)

handler = VercelPathMiddleware(app)
app = handler
