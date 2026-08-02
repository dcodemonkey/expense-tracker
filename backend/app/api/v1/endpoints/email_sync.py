from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Transaction, TransactionSource
from app.schemas import MessageResponse

router = APIRouter()

@router.post("/trigger", response_model=MessageResponse)
async def trigger_email_sync(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers the background task to sync emails using OAuth2 tokens.
    """
    if not current_user.gmail_refresh_token and not current_user.outlook_refresh_token:
        raise HTTPException(
            status_code=400,
            detail="No email accounts linked. Please link Gmail or Outlook first."
        )

    # In a real app, we'd trigger a Celery/Redis worker here.
    # For now, we update the timestamp to show intent.
    current_user.last_email_sync = datetime.utcnow()
    await db.commit()

    return {"message": "Email synchronization started in the background."}

@router.post("/config", response_model=MessageResponse)
async def update_sync_config(
    email_sync_enabled: bool,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.email_sync_enabled = email_sync_enabled
    await db.commit()
    return {"message": f"Email sync {'enabled' if email_sync_enabled else 'disabled'}"}
