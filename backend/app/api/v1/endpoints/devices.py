from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Device, DeviceType
from app.schemas import Device, DeviceCreate, DeviceUpdate

router = APIRouter()


@router.post("", response_model=Device, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_in: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.device_id == device_in.device_id, Device.user_id == current_user.id))
    device = result.scalar_one_or_none()

    if device:
        device.device_type = device_in.device_type
        device.device_name = device_in.device_name
        device.fcm_token = device_in.fcm_token
        device.is_active = True
    else:
        device = Device(
            user_id=current_user.id,
            **device_in.model_dump()
        )
        db.add(device)

    await db.commit()
    await db.refresh(device)
    return device


@router.get("", response_model=List[Device])
async def get_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.user_id == current_user.id).order_by(Device.created_at.desc()))
    return result.scalars().all()


@router.get("/{device_id}", response_model=Device)
async def get_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.device_id == device_id, Device.user_id == current_user.id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=Device)
async def update_device(
    device_id: str,
    device_in: DeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Device).where(Device.device_id == device_id, Device.user_id == current_user.id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    update_data = device_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
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