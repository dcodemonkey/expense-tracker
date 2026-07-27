from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Transaction, TransactionType, DailyInsight as DailyInsightModel, InsightType, Category, Budget, BudgetPeriod
from app.schemas import DashboardSummary, SpendingTrend, MerchantAnalysis, CategoryBreakdown, ChartDataPoint, DailyInsight

router = APIRouter()


@router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    month_start = today.replace(day=1)

    today_expenses_q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date == today
    )
    today_income_q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.INCOME,
        Transaction.transaction_date == today
    )
    month_expenses_q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date <= today
    )
    month_income_q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.INCOME,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date <= today
    )

    today_expenses_val = (await db.execute(today_expenses_q)).scalar() or Decimal("0")
    today_income_val = (await db.execute(today_income_q)).scalar() or Decimal("0")
    month_expenses_val = (await db.execute(month_expenses_q)).scalar() or Decimal("0")
    month_income_val = (await db.execute(month_income_q)).scalar() or Decimal("0")

    top_cats_query = select(
        Category.name, Category.icon, Category.color,
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).join(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= month_start
    ).group_by(Category.id, Category.name, Category.icon, Category.color).order_by(func.sum(Transaction.amount).desc()).limit(5)
    top_cats_result = await db.execute(top_cats_query)
    top_categories = [{"name": r.name, "icon": r.icon, "color": r.color, "amount": float(r.total)} for r in top_cats_result]

    recent_trans = await db.execute(select(Transaction).options(selectinload(Transaction.category)).where(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc()).limit(10))
    recent_transactions = recent_trans.scalars().all()

    from app.api.v1.endpoints.budgets import get_budgets
    budgets = await get_budgets(current_user, db)
    budget_alerts = [b for b in budgets if b.progress_percentage >= 80]

    insight_result = await db.execute(select(DailyInsightModel).where(
        DailyInsightModel.user_id == current_user.id,
        DailyInsightModel.insight_date == today
    ).order_by(DailyInsightModel.priority.desc()).limit(1))
    daily_insight = insight_result.scalar_one_or_none()

    return DashboardSummary(
        today_expenses=today_expenses_val,
        today_income=today_income_val,
        this_month_expenses=month_expenses_val,
        this_month_income=month_income_val,
        this_month_net=month_income_val - month_expenses_val,
        top_categories=top_categories,
        recent_transactions=recent_transactions,
        budget_alerts=budget_alerts,
        daily_insight=daily_insight
    )


@router.get("/spending-trend", response_model=SpendingTrend)
async def get_spending_trend(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    daily_query = select(
        Transaction.transaction_date,
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.transaction_date).order_by(Transaction.transaction_date)
    daily_result = await db.execute(daily_query)
    daily_data = [ChartDataPoint(date=str(r.transaction_date), amount=float(r.total)) for r in daily_result]

    weekly_query = select(
        func.date_trunc('week', Transaction.transaction_date).label("week_start"),
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by("week_start").order_by("week_start")
    weekly_result = await db.execute(weekly_query)
    weekly_data = [ChartDataPoint(date=str(r.week_start.date()), amount=float(r.total)) for r in weekly_result]

    monthly_query = select(
        func.date_trunc('month', Transaction.transaction_date).label("month_start"),
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by("month_start").order_by("month_start")
    monthly_result = await db.execute(monthly_query)
    monthly_data = [ChartDataPoint(date=str(r.month_start.date()), amount=float(r.total)) for r in monthly_result]

    return SpendingTrend(daily=daily_data, weekly=weekly_data, monthly=monthly_data)


@router.get("/merchant-analysis", response_model=List[MerchantAnalysis])
async def get_merchant_analysis(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    query = select(
        Transaction.merchant_name,
        func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.amount).label("avg"),
        Category.name.label("category")
    ).outerjoin(Category).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.merchant_name.isnot(None),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.merchant_name, Category.name).order_by(func.sum(Transaction.amount).desc()).limit(limit)

    result = await db.execute(query)
    return [
        MerchantAnalysis(
            merchant=r.merchant_name,
            total_amount=r.total,
            transaction_count=r.count,
            average_amount=r.avg,
            category=r.category
        ) for r in result
    ]


@router.get("/category-breakdown", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    query = select(
        Category.id,
        Category.name,
        Category.icon,
        Category.color,
        func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        func.count(Transaction.id).label("count")
    ).join(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Category.id, Category.name, Category.icon, Category.color).order_by(func.sum(Transaction.amount).desc())

    result = await db.execute(query)
    rows = result.all()

    total = sum(r.total for r in rows)

    return [
        CategoryBreakdown(
            category_id=r.id,
            category_name=r.name,
            category_icon=r.icon,
            category_color=r.color,
            total_amount=r.total,
            transaction_count=r.count,
            percentage=float(r.total / total * 100) if total > 0 else 0
        ) for r in rows
    ]


@router.get("/daily-insights", response_model=List[DailyInsight])
async def get_daily_insights(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    result = await db.execute(select(DailyInsightModel).where(
        DailyInsightModel.user_id == current_user.id,
        DailyInsightModel.insight_date >= start_date,
        DailyInsightModel.insight_date <= end_date
    ).order_by(DailyInsightModel.insight_date.desc(), DailyInsightModel.priority.desc()))
    return result.scalars().all()