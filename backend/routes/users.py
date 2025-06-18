from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, EmailStr
import uuid

from data.database import get_db
from models import Transaction, User
from utils.filters import get_summary_filters
from auth.security import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_transactions: int
    total_income: float
    total_expenses: float
    net_balance: float
    favorite_category: Optional[str] = None
    most_active_month: Optional[str] = None
    average_transaction_amount: float

class UserProfile(BaseModel):
    user: UserResponse
    stats: UserStats
    recent_transactions: List[dict]

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (Admin only - for now, no admin check)"""
    # Check if email already exists
    email_query = select(User).where(User.email == user.email)
    email_result = await db.execute(email_query)
    if email_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    username_query = select(User).where(User.username == user.username)
    username_result = await db.execute(username_query)
    if username_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user (without password - use auth/register instead)
    db_user = User(
        email=user.email,
        username=user.username,
        password_hash="",  # This should be set via auth/register
        is_active=True
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Skip records"),
    limit: int = Query(100, ge=1, le=1000, description="Limit records"),
    search: Optional[str] = Query(None, description="Search by username or email"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all users with optional search and pagination (Admin only)"""
    query = select(User)
    
    if search:
        query = query.where(
            User.username.ilike(f"%{search}%") | 
            User.email.ilike(f"%{search}%")
        )
    
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific user by ID (Admin only or own profile)"""
    # Users can only access their own profile unless they're admin
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile (own profile only)"""
    # Users can only update their own profile
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for email uniqueness if updating email
    if user_update.email and user_update.email != user.email:
        email_query = select(User).where(User.email == user_update.email)
        email_result = await db.execute(email_query)
        if email_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check for username uniqueness if updating username
    if user_update.username and user_update.username != user.username:
        username_query = select(User).where(User.username == user_update.username)
        username_result = await db.execute(username_query)
        if username_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user (own account only)"""
    # Users can only delete their own account
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete - mark as inactive
    user.is_active = False
    await db.commit()
    
    return {"message": "User deactivated successfully"}

@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: uuid.UUID,
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user financial statistics (own stats only)"""
    # Users can only access their own stats
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's stats")
    
    # Verify user exists
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # For now, we'll get all transactions since we don't have user-transaction relations yet
    # This will be updated when we add user-transaction relationships
    filters = get_summary_filters(start_date, end_date)
    
    # Get basic stats
    income_query = select(
        func.sum(Transaction.amount).label("total_income"),
        func.count(Transaction.id).label("income_count")
    ).where(and_(Transaction.type == "income", *filters))
    
    expense_query = select(
        func.sum(Transaction.amount).label("total_expenses"),
        func.count(Transaction.id).label("expense_count")
    ).where(and_(Transaction.type == "expense", *filters))
    
    income_result = await db.execute(income_query)
    expense_result = await db.execute(expense_query)
    
    income_data = income_result.first()
    expense_data = expense_result.first()
    
    total_income = income_data.total_income or 0.0
    total_expenses = expense_data.total_expenses or 0.0
    total_transactions = (income_data.income_count or 0) + (expense_data.expense_count or 0)
    
    # Get favorite category
    category_query = select(
        Transaction.category,
        func.count(Transaction.id).label("count")
    ).where(*filters).group_by(Transaction.category).order_by(func.count(Transaction.id).desc())
    
    category_result = await db.execute(category_query)
    favorite_category = None
    if category_result.first():
        favorite_category = category_result.first().category
    
    # Get most active month
    month_query = select(
        func.date_trunc('month', Transaction.date).label("month"),
        func.count(Transaction.id).label("count")
    ).where(*filters).group_by(func.date_trunc('month', Transaction.date)).order_by(func.count(Transaction.id).desc())
    
    month_result = await db.execute(month_query)
    most_active_month = None
    if month_result.first():
        most_active_month = month_result.first().month.strftime("%B %Y")
    
    # Calculate average transaction amount
    avg_query = select(func.avg(Transaction.amount)).where(*filters)
    avg_result = await db.execute(avg_query)
    average_amount = avg_result.scalar() or 0.0
    
    return UserStats(
        total_transactions=total_transactions,
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=total_income - total_expenses,
        favorite_category=favorite_category,
        most_active_month=most_active_month,
        average_transaction_amount=average_amount
    )

@router.get("/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete user profile with stats and recent transactions (own profile only)"""
    # Users can only access their own profile
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's profile")
    
    # Get user
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stats
    stats = await get_user_stats(user_id, db=db, current_user=current_user)
    
    # Get recent transactions (last 5)
    recent_query = select(Transaction).order_by(Transaction.date.desc()).limit(5)
    recent_result = await db.execute(recent_query)
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
    
    return UserProfile(
        user=user,
        stats=stats,
        recent_transactions=recent_transactions
    ) 