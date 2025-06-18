from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import uuid

from data.database import get_db
from models import Budget, Transaction, User
from utils.filters import get_summary_filters

router = APIRouter(prefix="/budgets", tags=["budgets"])

# Pydantic models
class BudgetCreate(BaseModel):
    user_id: uuid.UUID
    category: str
    amount: float
    period: str  # "monthly", "weekly", "yearly"
    start_date: datetime
    end_date: Optional[datetime] = None

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    period: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class BudgetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: str
    amount: float
    period: str
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class BudgetStatus(BaseModel):
    budget: BudgetResponse
    spent_amount: float
    remaining_amount: float
    percentage_used: float
    is_over_budget: bool
    days_remaining: Optional[int] = None

@router.post("/", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new budget"""
    # Validate period
    if budget.period not in ["monthly", "weekly", "yearly"]:
        raise HTTPException(status_code=400, detail="Period must be 'monthly', 'weekly', or 'yearly'")
    
    # Check if user exists
    user_query = select(User).where(User.id == budget.user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing active budget for the same category and user
    existing_query = select(Budget).where(
        and_(
            Budget.user_id == budget.user_id,
            Budget.category == budget.category,
            Budget.is_active == True
        )
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Active budget already exists for this category")
    
    db_budget = Budget(
        user_id=budget.user_id,
        category=budget.category,
        amount=budget.amount,
        period=budget.period,
        start_date=budget.start_date,
        end_date=budget.end_date
    )
    
    db.add(db_budget)
    await db.commit()
    await db.refresh(db_budget)
    
    return db_budget

@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db)
):
    """Get budgets with optional filtering"""
    query = select(Budget)
    
    if user_id:
        query = query.where(Budget.user_id == user_id)
    
    if category:
        query = query.where(Budget.category == category)
    
    if is_active is not None:
        query = query.where(Budget.is_active == is_active)
    
    query = query.order_by(Budget.created_at.desc())
    
    result = await db.execute(query)
    budgets = result.scalars().all()
    
    return budgets

@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific budget by ID"""
    query = select(Budget).where(Budget.id == budget_id)
    result = await db.execute(query)
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return budget

@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: uuid.UUID,
    budget_update: BudgetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a budget"""
    query = select(Budget).where(Budget.id == budget_id)
    result = await db.execute(query)
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Validate period if provided
    if budget_update.period and budget_update.period not in ["monthly", "weekly", "yearly"]:
        raise HTTPException(status_code=400, detail="Period must be 'monthly', 'weekly', or 'yearly'")
    
    # Update fields
    update_data = budget_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    await db.commit()
    await db.refresh(budget)
    
    return budget

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a budget"""
    query = select(Budget).where(Budget.id == budget_id)
    result = await db.execute(query)
    budget = result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    await db.delete(budget)
    await db.commit()
    
    return {"message": "Budget deleted successfully"}

@router.get("/{budget_id}/status", response_model=BudgetStatus)
async def get_budget_status(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get budget status with spending information"""
    # Get budget
    budget_query = select(Budget).where(Budget.id == budget_id)
    budget_result = await db.execute(budget_query)
    budget = budget_result.scalar_one_or_none()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Calculate date range for the budget period
    now = datetime.now()
    start_date = budget.start_date
    
    if budget.period == "monthly":
        end_date = start_date + timedelta(days=30)
    elif budget.period == "weekly":
        end_date = start_date + timedelta(days=7)
    else:  # yearly
        end_date = start_date + timedelta(days=365)
    
    # Get spent amount for the period
    spent_query = select(func.sum(Transaction.amount)).where(
        and_(
            Transaction.category == budget.category,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
    )
    
    spent_result = await db.execute(spent_query)
    spent_amount = spent_result.scalar() or 0.0
    
    # Calculate remaining amount and percentage
    remaining_amount = budget.amount - spent_amount
    percentage_used = (spent_amount / budget.amount) * 100 if budget.amount > 0 else 0
    is_over_budget = spent_amount > budget.amount
    
    # Calculate days remaining
    days_remaining = None
    if end_date > now:
        days_remaining = (end_date - now).days
    
    return BudgetStatus(
        budget=budget,
        spent_amount=spent_amount,
        remaining_amount=remaining_amount,
        percentage_used=percentage_used,
        is_over_budget=is_over_budget,
        days_remaining=days_remaining
    )

@router.get("/user/{user_id}/overview", response_model=List[BudgetStatus])
async def get_user_budgets_overview(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get overview of all active budgets for a user"""
    # Check if user exists
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all active budgets for the user
    budgets_query = select(Budget).where(
        and_(Budget.user_id == user_id, Budget.is_active == True)
    )
    budgets_result = await db.execute(budgets_query)
    budgets = budgets_result.scalars().all()
    
    budget_statuses = []
    for budget in budgets:
        # Calculate status for each budget
        now = datetime.now()
        start_date = budget.start_date
        
        if budget.period == "monthly":
            end_date = start_date + timedelta(days=30)
        elif budget.period == "weekly":
            end_date = start_date + timedelta(days=7)
        else:  # yearly
            end_date = start_date + timedelta(days=365)
        
        spent_query = select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.category == budget.category,
                Transaction.type == "expense",
                Transaction.date >= start_date,
                Transaction.date <= end_date
            )
        )
        
        spent_result = await db.execute(spent_query)
        spent_amount = spent_result.scalar() or 0.0
        
        remaining_amount = budget.amount - spent_amount
        percentage_used = (spent_amount / budget.amount) * 100 if budget.amount > 0 else 0
        is_over_budget = spent_amount > budget.amount
        
        days_remaining = None
        if end_date > now:
            days_remaining = (end_date - now).days
        
        budget_statuses.append(BudgetStatus(
            budget=budget,
            spent_amount=spent_amount,
            remaining_amount=remaining_amount,
            percentage_used=percentage_used,
            is_over_budget=is_over_budget,
            days_remaining=days_remaining
        ))
    
    return budget_statuses 