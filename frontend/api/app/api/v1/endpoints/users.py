from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date, timedelta, datetime
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User
from app.schemas import UserUpdate, User as UserSchema, LiveLocationUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.phone_number is not None:
        result = await db.execute(select(User).where(User.phone_number == user_in.phone_number, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")
        current_user.phone_number = user_in.phone_number
    if user_in.is_active is not None:
        current_user.is_active = user_in.is_active

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/live-location")
async def update_live_location(
    loc_in: LiveLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.latitude = loc_in.latitude
    current_user.longitude = loc_in.longitude
    if loc_in.location_name:
        current_user.last_location = loc_in.location_name
    current_user.last_location_updated_at = datetime.now()

    await db.commit()
    return {"status": "ok", "last_location": current_user.last_location}


@router.get("/all-locations", response_model=List[UserSchema])
async def get_all_user_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    result = await db.execute(select(User).order_by(User.last_location_updated_at.desc().nullslast()))
    users = result.scalars().all()

    # For any user missing active live_location, fallback to their latest transaction location & timestamp
    from app.models import Transaction
    for u in users:
        if not u.last_location:
            tx_res = await db.execute(
                select(Transaction)
                .where(
                    Transaction.user_id == u.id,
                    (Transaction.verified_location.isnot(None)) | (Transaction.location.isnot(None))
                )
                .order_by(Transaction.created_at.desc())
                .limit(1)
            )
            latest_tx = tx_res.scalar_one_or_none()
            if latest_tx:
                u.last_location = latest_tx.verified_location or latest_tx.location
                if latest_tx.verified_latitude and latest_tx.verified_longitude:
                    u.latitude = latest_tx.verified_latitude
                    u.longitude = latest_tx.verified_longitude
                u.last_location_updated_at = latest_tx.created_at

    return users


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.delete(current_user)
    await db.commit()