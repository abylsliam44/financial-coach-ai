from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, extract
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import uuid

from data.database import get_db
from models import Transaction, User
from utils.filters import get_summary_filters

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Pydantic models
class SpendingTrend(BaseModel):
    period: str
    total_amount: float
    transaction_count: int
    average_amount: float

class CategoryInsight(BaseModel):
    category: str
    total_spent: float
    transaction_count: int
    average_amount: float
    percentage_of_total: float
    trend: str  # "increasing", "decreasing", "stable"

class MonthlyComparison(BaseModel):
    month: str
    income: float
    expenses: float
    net_balance: float
    savings_rate: float

class SpendingPattern(BaseModel):
    day_of_week: str
    total_amount: float
    transaction_count: int
    average_amount: float

class FinancialHealth(BaseModel):
    savings_rate: float
    expense_to_income_ratio: float
    largest_expense_category: str
    most_frequent_category: str
    average_daily_spending: float
    spending_volatility: float

@router.get("/trends", response_model=List[SpendingTrend])
async def get_spending_trends(
    period: str = Query("monthly", description="Period: daily, weekly, monthly, yearly"),
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get spending trends over time"""
    if period not in ["daily", "weekly", "monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Period must be daily, weekly, monthly, or yearly")
    
    filters = get_summary_filters(start_date, end_date)
    
    if period == "daily":
        group_by = func.date(Transaction.date)
        period_format = func.date(Transaction.date)
    elif period == "weekly":
        group_by = func.date_trunc('week', Transaction.date)
        period_format = func.date_trunc('week', Transaction.date)
    elif period == "monthly":
        group_by = func.date_trunc('month', Transaction.date)
        period_format = func.date_trunc('month', Transaction.date)
    else:  # yearly
        group_by = func.date_trunc('year', Transaction.date)
        period_format = func.date_trunc('year', Transaction.date)
    
    query = select(
        period_format.label("period"),
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count"),
        func.avg(Transaction.amount).label("average_amount")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        group_by
    ).order_by(
        group_by
    )
    
    result = await db.execute(query)
    trends = []
    
    for row in result:
        trends.append(SpendingTrend(
            period=str(row.period),
            total_amount=row.total_amount,
            transaction_count=row.transaction_count,
            average_amount=row.average_amount
        ))
    
    return trends

@router.get("/categories/insights", response_model=List[CategoryInsight])
async def get_category_insights(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed insights for each expense category"""
    filters = get_summary_filters(start_date, end_date)
    
    # Get total expenses for percentage calculation
    total_query = select(func.sum(Transaction.amount)).where(
        and_(Transaction.type == "expense", *filters)
    )
    total_result = await db.execute(total_query)
    total_expenses = total_result.scalar() or 0.0
    
    # Get category insights
    category_query = select(
        Transaction.category,
        func.sum(Transaction.amount).label("total_spent"),
        func.count(Transaction.id).label("transaction_count"),
        func.avg(Transaction.amount).label("average_amount")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        Transaction.category
    ).order_by(
        func.sum(Transaction.amount).desc()
    )
    
    result = await db.execute(category_query)
    insights = []
    
    for row in result:
        percentage = (row.total_spent / total_expenses) * 100 if total_expenses > 0 else 0
        
        # Simple trend calculation (compare with previous period)
        # This is a simplified version - in a real app you'd want more sophisticated trend analysis
        trend = "stable"  # Default trend
        
        insights.append(CategoryInsight(
            category=row.category,
            total_spent=row.total_spent,
            transaction_count=row.transaction_count,
            average_amount=row.average_amount,
            percentage_of_total=percentage,
            trend=trend
        ))
    
    return insights

@router.get("/monthly-comparison", response_model=List[MonthlyComparison])
async def get_monthly_comparison(
    year: int = Query(..., description="Year to analyze"),
    db: AsyncSession = Depends(get_db)
):
    """Compare monthly income vs expenses for a specific year"""
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    
    # Get monthly data
    monthly_query = select(
        extract('month', Transaction.date).label("month"),
        func.sum(Transaction.amount).label("amount"),
        Transaction.type
    ).where(
        and_(
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
    ).group_by(
        extract('month', Transaction.date),
        Transaction.type
    ).order_by(
        extract('month', Transaction.date)
    )
    
    result = await db.execute(monthly_query)
    
    # Process results
    monthly_data = {}
    for row in result:
        month = int(row.month)
        if month not in monthly_data:
            monthly_data[month] = {"income": 0.0, "expenses": 0.0}
        
        if row.type == "income":
            monthly_data[month]["income"] = row.amount
        else:
            monthly_data[month]["expenses"] = row.amount
    
    # Format response
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    comparisons = []
    for month_num in range(1, 13):
        data = monthly_data.get(month_num, {"income": 0.0, "expenses": 0.0})
        income = data["income"]
        expenses = data["expenses"]
        net_balance = income - expenses
        savings_rate = (net_balance / income) * 100 if income > 0 else 0
        
        comparisons.append(MonthlyComparison(
            month=month_names[month_num - 1],
            income=income,
            expenses=expenses,
            net_balance=net_balance,
            savings_rate=savings_rate
        ))
    
    return comparisons

@router.get("/spending-patterns", response_model=List[SpendingPattern])
async def get_spending_patterns(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Analyze spending patterns by day of week"""
    filters = get_summary_filters(start_date, end_date)
    
    query = select(
        extract('dow', Transaction.date).label("day_of_week"),
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count"),
        func.avg(Transaction.amount).label("average_amount")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        extract('dow', Transaction.date)
    ).order_by(
        extract('dow', Transaction.date)
    )
    
    result = await db.execute(query)
    
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    patterns = []
    
    for row in result:
        day_num = int(row.day_of_week)
        patterns.append(SpendingPattern(
            day_of_week=day_names[day_num],
            total_amount=row.total_amount,
            transaction_count=row.transaction_count,
            average_amount=row.average_amount
        ))
    
    return patterns

@router.get("/financial-health", response_model=FinancialHealth)
async def get_financial_health(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """Get overall financial health metrics"""
    filters = get_summary_filters(start_date, end_date)
    
    # Get total income and expenses
    income_query = select(func.sum(Transaction.amount)).where(
        and_(Transaction.type == "income", *filters)
    )
    expense_query = select(func.sum(Transaction.amount)).where(
        and_(Transaction.type == "expense", *filters)
    )
    
    income_result = await db.execute(income_query)
    expense_result = await db.execute(expense_query)
    
    total_income = income_result.scalar() or 0.0
    total_expenses = expense_result.scalar() or 0.0
    
    # Calculate metrics
    savings_rate = ((total_income - total_expenses) / total_income) * 100 if total_income > 0 else 0
    expense_to_income_ratio = (total_expenses / total_income) * 100 if total_income > 0 else 0
    
    # Get largest expense category
    largest_category_query = select(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        Transaction.category
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).limit(1)
    
    largest_result = await db.execute(largest_category_query)
    largest_category = largest_result.first()
    largest_expense_category = largest_category.category if largest_category else "None"
    
    # Get most frequent category
    frequent_category_query = select(
        Transaction.category,
        func.count(Transaction.id).label("count")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        Transaction.category
    ).order_by(
        func.count(Transaction.id).desc()
    ).limit(1)
    
    frequent_result = await db.execute(frequent_category_query)
    frequent_category = frequent_result.first()
    most_frequent_category = frequent_category.category if frequent_category else "None"
    
    # Calculate average daily spending
    days_query = select(
        func.count(func.distinct(func.date(Transaction.date)))
    ).where(
        and_(Transaction.type == "expense", *filters)
    )
    
    days_result = await db.execute(days_query)
    active_days = days_result.scalar() or 1
    average_daily_spending = total_expenses / active_days
    
    # Calculate spending volatility (standard deviation of daily spending)
    daily_spending_query = select(
        func.date(Transaction.date).label("date"),
        func.sum(Transaction.amount).label("daily_total")
    ).where(
        and_(Transaction.type == "expense", *filters)
    ).group_by(
        func.date(Transaction.date)
    )
    
    daily_result = await db.execute(daily_spending_query)
    daily_amounts = [row.daily_total for row in daily_result]
    
    # Simple volatility calculation (in a real app, you'd use proper statistical methods)
    spending_volatility = 0.0
    if len(daily_amounts) > 1:
        mean = sum(daily_amounts) / len(daily_amounts)
        variance = sum((x - mean) ** 2 for x in daily_amounts) / len(daily_amounts)
        spending_volatility = variance ** 0.5
    
    return FinancialHealth(
        savings_rate=savings_rate,
        expense_to_income_ratio=expense_to_income_ratio,
        largest_expense_category=largest_expense_category,
        most_frequent_category=most_frequent_category,
        average_daily_spending=average_daily_spending,
        spending_volatility=spending_volatility
    )

@router.get("/user/{user_id}/dashboard")
async def get_user_dashboard(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive dashboard data for a user"""
    # Check if user exists
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current month data
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get monthly summary
    monthly_income_query = select(func.sum(Transaction.amount)).where(
        and_(
            Transaction.type == "income",
            Transaction.date >= start_of_month
        )
    )
    monthly_expense_query = select(func.sum(Transaction.amount)).where(
        and_(
            Transaction.type == "expense",
            Transaction.date >= start_of_month
        )
    )
    
    monthly_income_result = await db.execute(monthly_income_query)
    monthly_expense_result = await db.execute(monthly_expense_query)
    
    monthly_income = monthly_income_result.scalar() or 0.0
    monthly_expenses = monthly_expense_result.scalar() or 0.0
    
    # Get top spending categories this month
    top_categories_query = select(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).where(
        and_(
            Transaction.type == "expense",
            Transaction.date >= start_of_month
        )
    ).group_by(
        Transaction.category
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).limit(5)
    
    top_categories_result = await db.execute(top_categories_query)
    top_categories = [
        {"category": row.category, "amount": row.total}
        for row in top_categories_result
    ]
    
    # Get recent transactions
    recent_transactions_query = select(Transaction).order_by(
        Transaction.date.desc()
    ).limit(10)
    
    recent_result = await db.execute(recent_transactions_query)
    recent_transactions = []
    
    for transaction in recent_result.scalars().all():
        recent_transactions.append({
            "id": str(transaction.id),
            "amount": transaction.amount,
            "type": transaction.type,
            "category": transaction.category,
            "description": transaction.description,
            "date": transaction.date.isoformat()
        })
    
    return {
        "user_id": str(user_id),
        "current_month": {
            "income": monthly_income,
            "expenses": monthly_expenses,
            "net_balance": monthly_income - monthly_expenses,
            "savings_rate": ((monthly_income - monthly_expenses) / monthly_income) * 100 if monthly_income > 0 else 0
        },
        "top_spending_categories": top_categories,
        "recent_transactions": recent_transactions,
        "last_updated": now.isoformat()
    } 