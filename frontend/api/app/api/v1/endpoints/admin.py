from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_admin
from app.models import User, Transaction, TransactionType, ParsedMessage, Device, UserRole
from app.schemas import Transaction as TransactionSchema
from app.services.sms_parser import parse_sms_message, get_or_create_category

router = APIRouter()


def _role(value) -> str:
    return value.value if hasattr(value, "value") else value


@router.get("/stats")
async def admin_stats(
    admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)
):
    """Platform-wide counts and totals for the admin console overview."""
    users = await db.scalar(select(func.count(User.id)))
    transactions = await db.scalar(select(func.count(Transaction.id)))
    parsed_messages = await db.scalar(select(func.count(ParsedMessage.id)))
    devices = await db.scalar(select(func.count(Device.id)))
    unprocessed = await db.scalar(
        select(func.count(ParsedMessage.id)).where(ParsedMessage.is_processed == False)  # noqa: E712
    )
    total_expense = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == TransactionType.EXPENSE
        )
    )
    total_income = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.type == TransactionType.INCOME
        )
    )
    return {
        "users": users or 0,
        "transactions": transactions or 0,
        "parsed_messages": parsed_messages or 0,
        "unprocessed_messages": unprocessed or 0,
        "devices": devices or 0,
        "total_expense": float(total_expense or 0),
        "total_income": float(total_income or 0),
    }


@router.get("/users")
async def admin_users(
    admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)
):
    """All users with their transaction counts, roles, status, and latest location."""
    stmt = (
        select(
            User.id,
            User.email,
            User.full_name,
            User.phone_number,
            User.role,
            User.is_active,
            User.is_verified,
            User.last_location,
            User.latitude,
            User.longitude,
            User.last_location_updated_at,
            User.created_at,
            func.count(Transaction.id).label("transaction_count"),
        )
        .outerjoin(Transaction, Transaction.user_id == User.id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    result = []
    for r in rows:
        last_loc = r.last_location
        lat = r.latitude
        lon = r.longitude
        loc_updated_at = r.last_location_updated_at

        if not last_loc:
            tx_res = await db.execute(
                select(Transaction)
                .where(
                    Transaction.user_id == r.id,
                    (Transaction.verified_location.isnot(None)) | (Transaction.location.isnot(None))
                )
                .order_by(Transaction.created_at.desc())
                .limit(1)
            )
            latest_tx = tx_res.scalar_one_or_none()
            if latest_tx:
                last_loc = latest_tx.verified_location or latest_tx.location
                lat = latest_tx.verified_latitude
                lon = latest_tx.verified_longitude
                loc_updated_at = latest_tx.created_at

        result.append({
            "id": r.id,
            "email": r.email,
            "full_name": r.full_name,
            "phone_number": r.phone_number,
            "role": _role(r.role),
            "is_active": r.is_active,
            "is_verified": r.is_verified,
            "last_location": last_loc,
            "latitude": float(lat) if lat is not None else None,
            "longitude": float(lon) if lon is not None else None,
            "last_location_updated_at": loc_updated_at.isoformat() if loc_updated_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "transaction_count": r.transaction_count,
        })

    return result


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Grant or revoke admin permissions for a user."""
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'.")

    target_user.role = UserRole.ADMIN if role == "admin" else UserRole.USER
    await db.commit()
    return {"message": f"User role updated to '{role}'", "user_id": user_id, "role": role}


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account."""
    target_user = await db.scalar(select(User).where(User.id == user_id))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = is_active
    await db.commit()
    return {"message": f"User status updated to active={is_active}", "user_id": user_id, "is_active": is_active}


@router.get("/users/{user_id}/transactions", response_model=List[TransactionSchema])
async def admin_user_transactions(
    user_id: int,
    limit: int = Query(200, ge=1, le=1000),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """A single user's transactions (most recent first)."""
    exists = await db.scalar(select(User.id).where(User.id == user_id))
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
        .limit(limit)
    )
    return result.scalars().all()
