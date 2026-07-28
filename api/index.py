import os
import sys

# Add the 'backend' folder to the python path so imports inside 'app' work properly
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app

# Export the FastAPI app for Vercel Serverless Function
handler = app
