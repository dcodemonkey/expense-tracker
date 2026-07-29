from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import date, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Budget as BudgetModel, Category, Transaction, TransactionType, BudgetPeriod
from app.schemas import BudgetCreate, BudgetUpdate, Budget as BudgetSchema, BudgetWithProgress

router = APIRouter()


@router.post("", response_model=BudgetSchema, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if budget_in.category_id:
        result = await db.execute(select(Category).where(Category.id == budget_in.category_id, Category.user_id == current_user.id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    budget = BudgetModel(**budget_in.model_dump(), user_id=current_user.id)
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


@router.get("", response_model=List[BudgetWithProgress])
async def get_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetModel).where(BudgetModel.user_id == current_user.id, BudgetModel.is_active == True))
    budgets = result.scalars().all()

    today = date.today()
    response = []
    for budget in budgets:
        start = budget.start_date
        end = budget.end_date or today

        if budget.period == BudgetPeriod.MONTHLY:
            start = today.replace(day=1)
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        elif budget.period == BudgetPeriod.WEEKLY:
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
        elif budget.period == BudgetPeriod.DAILY:
            start = today
            end = today

        trans_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == current_user.id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end
        )
        if budget.category_id:
            trans_query = trans_query.where(Transaction.category_id == budget.category_id)

        trans_result = await db.execute(trans_query)
        spent = trans_result.scalar() or Decimal("0")

        remaining = budget.amount - spent
        progress = float(spent / budget.amount * 100) if budget.amount > 0 else 0

        cat = None
        if budget.category_id:
            cat_result = await db.execute(select(Category).where(Category.id == budget.category_id))
            cat = cat_result.scalar_one_or_none()

        d = {k: v for k, v in budget.__dict__.items() if not k.startswith('_')}
        response.append(BudgetWithProgress(
            **d,
            spent_amount=spent,
            remaining_amount=remaining,
            progress_percentage=progress,
            category=cat
        ))

    return response


@router.get("/{budget_id}", response_model=BudgetWithProgress)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetModel).where(BudgetModel.id == budget_id, BudgetModel.user_id == current_user.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    today = date.today()
    start = budget.start_date
    end = budget.end_date or today

    if budget.period == BudgetPeriod.MONTHLY:
        start = today.replace(day=1)
        if today.month == 12:
            end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    elif budget.period == BudgetPeriod.WEEKLY:
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif budget.period == BudgetPeriod.DAILY:
        start = today
        end = today

    trans_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start,
        Transaction.transaction_date <= end
    )
    if budget.category_id:
        trans_query = trans_query.where(Transaction.category_id == budget.category_id)

    trans_result = await db.execute(trans_query)
    spent = trans_result.scalar() or Decimal("0")

    remaining = budget.amount - spent
    progress = float(spent / budget.amount * 100) if budget.amount > 0 else 0

    cat = None
    if budget.category_id:
        cat_result = await db.execute(select(Category).where(Category.id == budget.category_id))
        cat = cat_result.scalar_one_or_none()

    d = {k: v for k, v in budget.__dict__.items() if not k.startswith('_')}
    return BudgetWithProgress(
        **d,
        spent_amount=spent,
        remaining_amount=remaining,
        progress_percentage=progress,
        category=cat
    )


@router.put("/{budget_id}", response_model=BudgetSchema)
async def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetModel).where(BudgetModel.id == budget_id, BudgetModel.user_id == current_user.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = budget_in.model_dump(exclude_unset=True)
    if "category_id" in update_data and update_data["category_id"]:
        result = await db.execute(select(Category).where(Category.id == update_data["category_id"], Category.user_id == current_user.id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.commit()
    await db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BudgetModel).where(BudgetModel.id == budget_id, BudgetModel.user_id == current_user.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    await db.delete(budget)
    await db.commit()