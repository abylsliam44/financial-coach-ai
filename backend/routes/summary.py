from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

from data.database import get_db
from models import Transaction, User
from utils.filters import get_summary_filters
from auth.security import get_current_active_user

router = APIRouter(prefix="/summary", tags=["summary"])

# Pydantic models for responses
class SummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    transaction_count: int

class CategorySummary(BaseModel):
    category: str
    total_amount: float
    transaction_count: int

class DailySummary(BaseModel):
    date: date
    total_income: float
    total_expenses: float
    net_balance: float
    transaction_count: int

@router.get("/", response_model=SummaryResponse)
async def get_summary(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get total income, expenses, and net balance for the authenticated user"""
    # Build base filters including user_id
    base_filters = [Transaction.user_id == current_user.id]
    
    # Add date filters if provided
    if start_date:
        base_filters.append(Transaction.date >= start_date)
    
    if end_date:
        end_date_plus_one = datetime.combine(end_date, datetime.max.time())
        base_filters.append(Transaction.date <= end_date_plus_one)
    
    # Get income summary
    income_query = select(
        func.sum(Transaction.amount).label("total_income"),
        func.count(Transaction.id).label("income_count")
    ).where(and_(Transaction.type == "income", *base_filters))
    
    income_result = await db.execute(income_query)
    income_data = income_result.first()
    total_income = income_data.total_income or 0.0
    income_count = income_data.income_count or 0
    
    # Get expense summary
    expense_query = select(
        func.sum(Transaction.amount).label("total_expenses"),
        func.count(Transaction.id).label("expense_count")
    ).where(and_(Transaction.type == "expense", *base_filters))
    
    expense_result = await db.execute(expense_query)
    expense_data = expense_result.first()
    total_expenses = expense_data.total_expenses or 0.0
    expense_count = expense_data.expense_count or 0
    
    return SummaryResponse(
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=total_income - total_expenses,
        transaction_count=income_count + expense_count
    )

@router.get("/by-category/", response_model=List[CategorySummary])
async def get_summary_by_category(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get expense breakdown by category for the authenticated user"""
    # Build base filters including user_id
    base_filters = [Transaction.user_id == current_user.id]
    
    # Add date filters if provided
    if start_date:
        base_filters.append(Transaction.date >= start_date)
    
    if end_date:
        end_date_plus_one = datetime.combine(end_date, datetime.max.time())
        base_filters.append(Transaction.date <= end_date_plus_one)
    
    query = select(
        Transaction.category,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count")
    ).where(
        and_(Transaction.type == "expense", *base_filters)
    ).group_by(
        Transaction.category
    ).order_by(
        func.sum(Transaction.amount).desc()
    )
    
    result = await db.execute(query)
    categories = []
    
    for row in result:
        categories.append(CategorySummary(
            category=row.category,
            total_amount=row.total_amount,
            transaction_count=row.transaction_count
        ))
    
    return categories

@router.get("/by-day/", response_model=List[DailySummary])
async def get_summary_by_day(
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get totals grouped by date for the authenticated user"""
    # Build base filters including user_id
    base_filters = [Transaction.user_id == current_user.id]
    
    # Add date filters if provided
    if start_date:
        base_filters.append(Transaction.date >= start_date)
    
    if end_date:
        end_date_plus_one = datetime.combine(end_date, datetime.max.time())
        base_filters.append(Transaction.date <= end_date_plus_one)
    
    # Get daily income
    income_query = select(
        func.date(Transaction.date).label("date"),
        func.sum(Transaction.amount).label("total_income"),
        func.count(Transaction.id).label("income_count")
    ).where(
        and_(Transaction.type == "income", *base_filters)
    ).group_by(
        func.date(Transaction.date)
    )
    
    income_result = await db.execute(income_query)
    income_by_date = {row.date: {"income": row.total_income, "income_count": row.income_count} for row in income_result}
    
    # Get daily expenses
    expense_query = select(
        func.date(Transaction.date).label("date"),
        func.sum(Transaction.amount).label("total_expenses"),
        func.count(Transaction.id).label("expense_count")
    ).where(
        and_(Transaction.type == "expense", *base_filters)
    ).group_by(
        func.date(Transaction.date)
    )
    
    expense_result = await db.execute(expense_query)
    expense_by_date = {row.date: {"expenses": row.total_expenses, "expense_count": row.expense_count} for row in expense_result}
    
    # Combine and format results
    all_dates = set(income_by_date.keys()) | set(expense_by_date.keys())
    daily_summaries = []
    
    for date_val in sorted(all_dates, reverse=True):
        income_data = income_by_date.get(date_val, {"income": 0, "income_count": 0})
        expense_data = expense_by_date.get(date_val, {"expenses": 0, "expense_count": 0})
        
        daily_summaries.append(DailySummary(
            date=date_val,
            total_income=income_data["income"],
            total_expenses=expense_data["expenses"],
            net_balance=income_data["income"] - expense_data["expenses"],
            transaction_count=income_data["income_count"] + expense_data["expense_count"]
        ))
    
    return daily_summaries 