from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Device, DeviceType, Transaction, TransactionType, TransactionSource, Category, ParsedMessage
from app.schemas import SyncRequest, SyncResponse, Device, ParsedMessageCreate
from app.services.sms_parser import parse_sms_message, get_or_create_category

router = APIRouter()


@router.post("/sync", response_model=SyncResponse)
async def sync_device(
    sync_in: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.device_id == sync_in.device_id, Device.user_id == current_user.id))
    device = result.scalar_one_or_none()

    if not device:
        device = Device(
            user_id=current_user.id,
            device_id=sync_in.device_id,
            device_type=sync_in.device_type,
            device_name=sync_in.device_name,
            fcm_token=sync_in.fcm_token
        )
        db.add(device)
    else:
        device.device_type = sync_in.device_type
        device.device_name = sync_in.device_name
        device.fcm_token = sync_in.fcm_token
        device.last_sync_at = datetime.utcnow()

    await db.commit()
    await db.refresh(device)

    processed = 0
    created = 0
    errors = []

    for msg in sync_in.messages:
        try:
            parsed_msg = ParsedMessage(
                user_id=current_user.id,
                device_id=device.id,
                source=msg.source,
                raw_content=msg.raw_content,
                sender=msg.sender,
                received_at=msg.received_at
            )
            db.add(parsed_msg)
            await db.flush()

            parsed = parse_sms_message(msg.raw_content, msg.sender, msg.received_at)

            if parsed and parsed.get("amount"):
                category_id = await get_or_create_category(parsed.get("category", "Others"), current_user, db)

                transaction = Transaction(
                    user_id=current_user.id,
                    category_id=category_id,
                    amount=parsed["amount"],
                    currency=parsed.get("currency", "INR"),
                    type=parsed["type"],
                    source=msg.source,
                    description=parsed.get("description"),
                    merchant_name=parsed.get("merchant_name"),
                    transaction_date=parsed["transaction_date"],
                    raw_message=msg.raw_content,
                    parsed_confidence=Decimal(str(parsed.get("confidence", 0.8)))
                )
                db.add(transaction)
                await db.flush()
                created += 1

                parsed_msg.transaction_id = transaction.id
                parsed_msg.is_processed = True
                parsed_msg.processed_at = datetime.utcnow()
                parsed_msg.parsed_amount = parsed["amount"]
                parsed_msg.parsed_currency = parsed.get("currency", "INR")
                parsed_msg.parsed_merchant = parsed.get("merchant_name")
                parsed_msg.parsed_category = parsed.get("category", "Others")
                parsed_msg.parsed_date = parsed["transaction_date"]
                parsed_msg.parsed_type = parsed["type"]
                parsed_msg.confidence_score = Decimal(str(parsed.get("confidence", 0.8)))

            processed += 1
        except Exception as e:
            errors.append(f"Message from {msg.sender}: {str(e)}")

    await db.commit()

    return SyncResponse(
        success=True,
        processed_count=processed,
        created_transactions=created,
        errors=errors
    )


@router.get("/devices", response_model=List[Device])
async def get_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.user_id == current_user.id).order_by(Device.created_at.desc()))
    return result.scalars().all()


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.device_id == device_id, Device.user_id == current_user.id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    await db.delete(device)
    await db.commit()