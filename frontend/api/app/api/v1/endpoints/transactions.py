from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Transaction as TransactionModel, Category, TransactionType, TransactionSource, TransactionStatus
from app.schemas import TransactionCreate, TransactionUpdate, Transaction as TransactionSchema, TransactionSummary, TransactionWithCategory

router = APIRouter()


@router.post("", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    trans_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if trans_in.category_id:
        result = await db.execute(select(Category).where(Category.id == trans_in.category_id, Category.user_id == current_user.id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    transaction = TransactionModel(**trans_in.model_dump(), user_id=current_user.id)
    db.add(transaction)
    await db.commit()

    result = await db.execute(
        select(TransactionModel)
        .options(selectinload(TransactionModel.category))
        .where(TransactionModel.id == transaction.id)
    )
    return result.scalar_one()


@router.get("", response_model=List[TransactionWithCategory])
async def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    merchant: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(TransactionModel).options(selectinload(TransactionModel.category)).where(TransactionModel.user_id == current_user.id)

    if start_date:
        query = query.where(TransactionModel.transaction_date >= start_date)
    if end_date:
        query = query.where(TransactionModel.transaction_date <= end_date)
    if category_id:
        query = query.where(TransactionModel.category_id == category_id)
    if type:
        query = query.where(TransactionModel.type == type)
    if merchant:
        query = query.where(TransactionModel.merchant_name.ilike(f"%{merchant}%"))

    query = query.order_by(TransactionModel.transaction_date.desc(), TransactionModel.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/summary", response_model=TransactionSummary)
async def get_transaction_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    query = select(TransactionModel).where(
        TransactionModel.user_id == current_user.id,
        TransactionModel.transaction_date >= start_date,
        TransactionModel.transaction_date <= end_date
    )
    result = await db.execute(query)
    transactions = result.scalars().all()

    total_expenses = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE)
    total_income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME)

    by_category = {}
    for t in transactions:
        if t.type == TransactionType.EXPENSE:
            cat_name = t.category.name if t.category else "Uncategorized"
            if cat_name not in by_category:
                by_category[cat_name] = {"amount": Decimal("0"), "count": 0}
            by_category[cat_name]["amount"] += t.amount
            by_category[cat_name]["count"] += 1

    by_merchant = {}
    for t in transactions:
        if t.merchant_name:
            if t.merchant_name not in by_merchant:
                by_merchant[t.merchant_name] = {"amount": Decimal("0"), "count": 0}
            by_merchant[t.merchant_name]["amount"] += t.amount
            by_merchant[t.merchant_name]["count"] += 1

    return TransactionSummary(
        total_expenses=total_expenses,
        total_income=total_income,
        net_amount=total_income - total_expenses,
        transaction_count=len(transactions),
        by_category=[{"category": k, **v} for k, v in by_category.items()],
        by_merchant=[{"merchant": k, **v} for k, v in by_merchant.items()]
    )


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TransactionModel).options(selectinload(TransactionModel.category))
        .where(TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(
    transaction_id: int,
    trans_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TransactionModel).where(TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = trans_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()

    result = await db.execute(
        select(TransactionModel)
        .options(selectinload(TransactionModel.category))
        .where(TransactionModel.id == transaction.id)
    )
    return result.scalar_one()


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TransactionModel).where(TransactionModel.id == transaction_id, TransactionModel.user_id == current_user.id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()