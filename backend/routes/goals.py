from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import uuid

from data.database import get_db
from models import Goal, Transaction, User
from utils.filters import get_summary_filters
from auth.security import get_current_active_user

router = APIRouter(prefix="/goals", tags=["goals"])

# Pydantic models
class GoalCreate(BaseModel):
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    target_amount: float
    target_date: Optional[datetime] = None
    category: Optional[str] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class GoalResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    target_date: Optional[datetime]
    category: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class GoalProgress(BaseModel):
    goal: GoalResponse
    progress_percentage: float
    remaining_amount: float
    days_remaining: Optional[int] = None
    is_completed: bool
    is_overdue: bool
    estimated_completion_date: Optional[datetime] = None

@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new financial goal for the authenticated user"""
    # Users can only create goals for themselves
    if str(goal.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to create goal for another user")
    
    # Check if user exists
    user_query = select(User).where(User.id == goal.user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate target amount
    if goal.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be greater than 0")
    
    # Check if target date is in the past
    if goal.target_date and goal.target_date < datetime.now():
        raise HTTPException(status_code=400, detail="Target date cannot be in the past")
    
    db_goal = Goal(
        user_id=goal.user_id,
        name=goal.name,
        description=goal.description,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        category=goal.category
    )
    
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    
    return db_goal

@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_completed: Optional[bool] = Query(None, description="Filter by completion status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get goals for the authenticated user with optional filtering"""
    query = select(Goal).where(Goal.user_id == current_user.id)
    
    if category:
        query = query.where(Goal.category == category)
    
    if is_active is not None:
        query = query.where(Goal.is_active == is_active)
    
    if is_completed is not None:
        if is_completed:
            query = query.where(Goal.current_amount >= Goal.target_amount)
        else:
            query = query.where(Goal.current_amount < Goal.target_amount)
    
    query = query.order_by(Goal.created_at.desc())
    
    result = await db.execute(query)
    goals = result.scalars().all()
    
    return goals

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific goal by ID (only if owned by current user)"""
    query = select(Goal).where(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return goal

@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a goal (only if owned by current user)"""
    query = select(Goal).where(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Validate target amount if provided
    if goal_update.target_amount is not None and goal_update.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be greater than 0")
    
    # Validate current amount if provided
    if goal_update.current_amount is not None and goal_update.current_amount < 0:
        raise HTTPException(status_code=400, detail="Current amount cannot be negative")
    
    # Check if target date is in the past
    if goal_update.target_date and goal_update.target_date < datetime.now():
        raise HTTPException(status_code=400, detail="Target date cannot be in the past")
    
    # Update fields
    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    await db.commit()
    await db.refresh(goal)
    
    return goal

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a goal (only if owned by current user)"""
    query = select(Goal).where(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    )
    result = await db.execute(query)
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    await db.delete(goal)
    await db.commit()
    
    return {"message": "Goal deleted successfully"}

@router.get("/{goal_id}/progress", response_model=GoalProgress)
async def get_goal_progress(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get goal progress with detailed information (only if owned by current user)"""
    # Get goal
    goal_query = select(Goal).where(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    )
    goal_result = await db.execute(goal_query)
    goal = goal_result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Calculate progress
    progress_percentage = (goal.current_amount / goal.target_amount) * 100 if goal.target_amount > 0 else 0
    remaining_amount = goal.target_amount - goal.current_amount
    is_completed = goal.current_amount >= goal.target_amount
    is_overdue = False
    days_remaining = None
    estimated_completion_date = None
    
    # Calculate days remaining and check if overdue
    if goal.target_date:
        now = datetime.now()
        days_remaining = (goal.target_date - now).days
        is_overdue = days_remaining < 0 and not is_completed
    
    # Estimate completion date based on current progress and rate
    if not is_completed and goal.current_amount > 0:
        # Calculate average daily contribution (simplified)
        days_since_creation = (datetime.now() - goal.created_at).days
        if days_since_creation > 0:
            daily_rate = goal.current_amount / days_since_creation
            if daily_rate > 0:
                days_to_complete = remaining_amount / daily_rate
                estimated_completion_date = datetime.now() + timedelta(days=days_to_complete)
    
    return GoalProgress(
        goal=goal,
        progress_percentage=progress_percentage,
        remaining_amount=remaining_amount,
        days_remaining=days_remaining,
        is_completed=is_completed,
        is_overdue=is_overdue,
        estimated_completion_date=estimated_completion_date
    )

@router.post("/{goal_id}/contribute")
async def contribute_to_goal(
    goal_id: uuid.UUID,
    amount: float,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add contribution to a goal (only if owned by current user)"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Contribution amount must be greater than 0")
    
    # Get goal
    goal_query = select(Goal).where(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    )
    goal_result = await db.execute(goal_query)
    goal = goal_result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if not goal.is_active:
        raise HTTPException(status_code=400, detail="Cannot contribute to inactive goal")
    
    # Update current amount
    goal.current_amount += amount
    
    await db.commit()
    await db.refresh(goal)
    
    return {
        "message": f"Successfully contributed ${amount:.2f} to goal",
        "new_current_amount": goal.current_amount,
        "remaining_amount": goal.target_amount - goal.current_amount
    }

@router.get("/user/{user_id}/overview", response_model=List[GoalProgress])
async def get_user_goals_overview(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overview of all active goals for a user (own goals only)"""
    # Users can only access their own goal overview
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's goal overview")
    
    # Check if user exists
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all active goals for the user
    goals_query = select(Goal).where(
        and_(Goal.user_id == user_id, Goal.is_active == True)
    )
    goals_result = await db.execute(goals_query)
    goals = goals_result.scalars().all()
    
    goal_progresses = []
    for goal in goals:
        # Calculate progress for each goal
        progress_percentage = (goal.current_amount / goal.target_amount) * 100 if goal.target_amount > 0 else 0
        remaining_amount = goal.target_amount - goal.current_amount
        is_completed = goal.current_amount >= goal.target_amount
        is_overdue = False
        days_remaining = None
        estimated_completion_date = None
        
        if goal.target_date:
            now = datetime.now()
            days_remaining = (goal.target_date - now).days
            is_overdue = days_remaining < 0 and not is_completed
        
        if not is_completed and goal.current_amount > 0:
            days_since_creation = (datetime.now() - goal.created_at).days
            if days_since_creation > 0:
                daily_rate = goal.current_amount / days_since_creation
                if daily_rate > 0:
                    days_to_complete = remaining_amount / daily_rate
                    estimated_completion_date = datetime.now() + timedelta(days=days_to_complete)
        
        goal_progresses.append(GoalProgress(
            goal=goal,
            progress_percentage=progress_percentage,
            remaining_amount=remaining_amount,
            days_remaining=days_remaining,
            is_completed=is_completed,
            is_overdue=is_overdue,
            estimated_completion_date=estimated_completion_date
        ))
    
    return goal_progresses 