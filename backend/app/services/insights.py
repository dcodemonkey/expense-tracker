from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from app.models import User, Transaction, Category, Budget, DailyInsight, TransactionType, BudgetPeriod, InsightType


async def generate_daily_insights(db: AsyncSession, user: User, insight_date: date = None):
    if insight_date is None:
        insight_date = date.today()

    existing = await db.execute(select(DailyInsight).where(
        DailyInsight.user_id == user.id,
        DailyInsight.insight_date == insight_date
    ))
    if existing.scalar_one_or_none():
        return

    insights = []

    today_expenses = await db.execute(select(func.sum(Transaction.amount)).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date == insight_date
    ))
    today_income = await db.execute(select(func.sum(Transaction.amount)).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.INCOME,
        Transaction.transaction_date == insight_date
    ))

    today_expense_total = today_expenses.scalar() or Decimal("0")
    today_income_total = today_income.scalar() or Decimal("0")

    if today_expense_total > 0:
        insights.append(DailyInsight(
            user_id=user.id,
            insight_date=insight_date,
            insight_type=InsightType.DAILY_SUMMARY,
            title="Daily Spending Summary",
            description=f"You spent ₹{today_expense_total:,.2f} today" + (f" and earned ₹{today_income_total:,.2f}" if today_income_total > 0 else ""),
            priority=1
        ))

    month_start = insight_date.replace(day=1)
    month_expenses = await db.execute(select(func.sum(Transaction.amount)).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date <= insight_date
    ))
    month_expense_total = month_expenses.scalar() or Decimal("0")

    budgets = await db.execute(select(Budget).where(
        Budget.user_id == user.id,
        Budget.is_active == True,
        Budget.start_date <= insight_date,
        (Budget.end_date.is_(None)) | (Budget.end_date >= insight_date)
    ))
    for budget in budgets.scalars().all():
        if budget.period == BudgetPeriod.MONTHLY:
            period_start = month_start
            period_end = insight_date
        elif budget.period == BudgetPeriod.WEEKLY:
            period_start = insight_date - timedelta(days=insight_date.weekday())
            period_end = period_start + timedelta(days=6)
        elif budget.period == BudgetPeriod.DAILY:
            period_start = insight_date
            period_end = insight_date
        else:
            period_start = budget.start_date
            period_end = budget.end_date or insight_date

        spent_query = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user.id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end
        )
        if budget.category_id:
            spent_query = spent_query.where(Transaction.category_id == budget.category_id)

        spent_result = await db.execute(spent_query)
        spent = spent_result.scalar() or Decimal("0")

        if budget.amount > 0:
            percentage = float(spent / budget.amount * 100)
            if percentage >= 100:
                insights.append(DailyInsight(
                    user_id=user.id,
                    insight_date=insight_date,
                    insight_type=InsightType.BUDGET_ALERT,
                    title=f"Budget Exceeded: {budget.name}",
                    description=f"You've spent ₹{spent:,.2f} of your ₹{budget.amount:,.2f} budget ({percentage:.0f}%)",
                    priority=0
                ))
            elif percentage >= 80:
                insights.append(DailyInsight(
                    user_id=user.id,
                    insight_date=insight_date,
                    insight_type=InsightType.BUDGET_ALERT,
                    title=f"Budget Alert: {budget.name}",
                    description=f"You've used {percentage:.0f}% of your ₹{budget.amount:,.2f} budget",
                    priority=1
                ))

    top_categories = await db.execute(select(
        Category.name,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date == insight_date
    ).group_by(Category.id).order_by(desc("total")).limit(3))

    if top_categories.first():
        cats = [f"{row.name}: ₹{row.total:,.2f}" for row in top_categories]
        insights.append(DailyInsight(
            user_id=user.id,
            insight_date=insight_date,
            insight_type=InsightType.CATEGORY_BREAKDOWN,
            title="Top Spending Categories Today",
            description="; ".join(cats),
            priority=2
        ))

    yesterday = insight_date - timedelta(days=1)
    yesterday_expenses = await db.execute(select(func.sum(Transaction.amount)).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date == yesterday
    ))
    yesterday_total = yesterday_expenses.scalar() or Decimal("0")

    if yesterday_total > 0 and today_expense_total > 0:
        change_pct = float((today_expense_total - yesterday_total) / yesterday_total * 100)
        if abs(change_pct) > 20:
            trend = "increased" if change_pct > 0 else "decreased"
            insights.append(DailyInsight(
                user_id=user.id,
                insight_date=insight_date,
                insight_type=InsightType.SPENDING_TREND,
                title=f"Spending {trend.capitalize()} vs Yesterday",
                description=f"Today's spending {trend} by {abs(change_pct):.0f}% compared to yesterday",
                priority=2 if change_pct > 0 else 3
            ))

    for insight in insights:
        db.add(insight)

    await db.commit()


async def get_spending_trend(db: AsyncSession, user: User, days: int = 30) -> dict:
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    daily = await db.execute(select(
        Transaction.transaction_date,
        func.sum(Transaction.amount).label("total")
    ).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.transaction_date).order_by(Transaction.transaction_date))

    daily_data = [{"date": str(row.transaction_date), "amount": float(row.total)} for row in daily]

    weekly = await db.execute(select(
        func.date_trunc('week', Transaction.transaction_date).label("week_start"),
        func.sum(Transaction.amount).label("total")
    ).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by("week_start").order_by("week_start"))

    weekly_data = [{"date": str(row.week_start.date()), "amount": float(row.total)} for row in weekly]

    monthly = await db.execute(select(
        func.date_trunc('month', Transaction.transaction_date).label("month_start"),
        func.sum(Transaction.amount).label("total")
    ).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by("month_start").order_by("month_start"))

    monthly_data = [{"date": str(row.month_start.date()), "amount": float(row.total)} for row in monthly]

    return {"daily": daily_data, "weekly": weekly_data, "monthly": monthly_data}


async def get_merchant_analysis(db: AsyncSession, user: User, start_date: date, end_date: date, limit: int = 20) -> List[dict]:
    query = select(
        Transaction.merchant_name,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.amount).label("avg"),
        Category.name.label("category")
    ).outerjoin(Category).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.merchant_name.isnot(None),
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.merchant_name, Category.name).order_by(desc("total")).limit(limit)

    result = await db.execute(query)
    return [
        {
            "merchant": row.merchant_name,
            "total_amount": float(row.total),
            "transaction_count": row.count,
            "average_amount": float(row.avg),
            "category": row.category
        } for row in result
    ]


async def get_category_breakdown(db: AsyncSession, user: User, start_date: date, end_date: date) -> List[dict]:
    query = select(
        Category.id,
        Category.name,
        Category.icon,
        Category.color,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).join(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Category.id).order_by(desc("total"))

    result = await db.execute(query)
    rows = result.all()

    total = sum(row.total for row in rows)

    return [
        {
            "category_id": row.id,
            "category_name": row.name,
            "category_icon": row.icon,
            "category_color": row.color,
            "total_amount": float(row.total),
            "transaction_count": row.count,
            "percentage": float(row.total / total * 100) if total > 0 else 0
        } for row in rows
    ]


async def detect_anomalies(db: AsyncSession, user: User, days: int = 7) -> List[dict]:
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    recent_avg = await db.execute(select(
        func.avg(Transaction.amount).label("avg_amount")
    ).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ))
    avg_amount = recent_avg.scalar() or Decimal("0")

    anomalies = await db.execute(select(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.amount > avg_amount * 3,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).order_by(desc(Transaction.amount)).limit(5))

    return [
        {
            "transaction_id": t.id,
            "amount": float(t.amount),
            "merchant": t.merchant_name,
            "date": str(t.transaction_date),
            "category": t.category.name if t.category else "Uncategorized",
            "times_average": float(t.amount / avg_amount) if avg_amount > 0 else 0
        } for t in anomalies.scalars().all()
    ]