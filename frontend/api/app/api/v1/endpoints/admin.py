from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_admin
from app.models import User, Transaction, TransactionType, ParsedMessage, Device
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
    """All users with their transaction counts and latest location."""
    stmt = (
        select(
            User.id,
            User.email,
            User.full_name,
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

        # Fallback to latest transaction location & timestamp if active location is null
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
            "role": _role(r.role),
            "is_active": r.is_active,
            "is_verified": r.is_verified,
            "last_location": last_loc,
            "latitude": float(lat) if lat is not None else None,
            "longitude": float(lon) if lon is not None else None,
            "last_location_updated_at": loc_updated_at.isoformat() if loc_updated_at else None,
            "created_at": r.created_at,
            "transaction_count": r.transaction_count,
        })

    return result


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


@router.get("/parsed-messages")
async def admin_parsed_messages(
    is_processed: Optional[bool] = None,
    user_id: Optional[int] = None,
    limit: int = Query(200, ge=1, le=1000),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Raw ingested messages and their parsed fields, for inspection/debugging."""
    stmt = select(ParsedMessage).order_by(ParsedMessage.received_at.desc()).limit(limit)
    if is_processed is not None:
        stmt = stmt.where(ParsedMessage.is_processed == is_processed)
    if user_id is not None:
        stmt = stmt.where(ParsedMessage.user_id == user_id)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "device_id": m.device_id,
            "source": _role(m.source),
            "sender": m.sender,
            "raw_content": m.raw_content,
            "received_at": m.received_at,
            "parsed_amount": float(m.parsed_amount) if m.parsed_amount is not None else None,
            "parsed_currency": m.parsed_currency,
            "parsed_merchant": m.parsed_merchant,
            "parsed_category": m.parsed_category,
            "parsed_type": _role(m.parsed_type) if m.parsed_type is not None else None,
            "confidence_score": float(m.confidence_score) if m.confidence_score is not None else None,
            "is_processed": m.is_processed,
            "transaction_id": m.transaction_id,
        }
        for m in rows
    ]


@router.post("/parsed-messages/{message_id}/reparse")
async def admin_reparse_message(
    message_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Re-run the parser on a stored message and sync its linked transaction."""
    msg = await db.scalar(select(ParsedMessage).where(ParsedMessage.id == message_id))
    if msg is None:
        raise HTTPException(status_code=404, detail="Parsed message not found")

    owner = await db.scalar(select(User).where(User.id == msg.user_id))
    parsed = parse_sms_message(msg.raw_content, msg.sender or "", msg.received_at)

    if not parsed or not parsed.get("amount"):
        msg.confidence_score = Decimal("0")
        await db.commit()
        return {"message": "Could not parse a transaction from this message", "parsed": False}

    category_id = await get_or_create_category(parsed.get("category", "Others"), owner, db)

    txn = None
    if msg.transaction_id:
        txn = await db.scalar(select(Transaction).where(Transaction.id == msg.transaction_id))
    if txn is None:
        txn = Transaction(user_id=msg.user_id, source=msg.source, raw_message=msg.raw_content)
        db.add(txn)

    txn.category_id = category_id
    txn.amount = parsed["amount"]
    txn.currency = parsed.get("currency", "INR")
    txn.type = parsed["type"]
    txn.description = parsed.get("description")
    txn.merchant_name = parsed.get("merchant_name")
    txn.transaction_date = parsed["transaction_date"]
    txn.parsed_confidence = Decimal(str(parsed.get("confidence", 0.8)))
    await db.flush()

    msg.transaction_id = txn.id
    msg.is_processed = True
    msg.processed_at = datetime.utcnow()
    msg.parsed_amount = parsed["amount"]
    msg.parsed_currency = parsed.get("currency", "INR")
    msg.parsed_merchant = parsed.get("merchant_name")
    msg.parsed_category = parsed.get("category", "Others")
    msg.parsed_date = parsed["transaction_date"]
    msg.parsed_type = parsed["type"]
    msg.confidence_score = Decimal(str(parsed.get("confidence", 0.8)))
    await db.commit()

    return {"message": "Reparsed successfully", "parsed": True, "transaction_id": txn.id}
