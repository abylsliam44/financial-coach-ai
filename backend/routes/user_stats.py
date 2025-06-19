from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
import uuid

from data.database import get_db
from models import User, UserStats, UserProfile
from auth.security import get_current_active_user
from utils.gamification import calculate_hourly_rate

router = APIRouter(prefix="/user-stats", tags=["user-stats"])

class UserStatsResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    xp: int
    level: int
    streak: int
    total_minutes_lost: int
    hours_lost: float
    last_transaction_date: Optional[str]
    hourly_rate: float
    minutes_to_next_level: int
    
    class Config:
        from_attributes = True

@router.get("/{user_id}", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user stats for a specific user (only if requesting own stats)"""
    # Users can only view their own stats
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="You can only view your own stats"
        )
    
    # Get user stats
    stats_query = select(UserStats).where(UserStats.user_id == user_id)
    stats_result = await db.execute(stats_query)
    user_stats = stats_result.scalar_one_or_none()
    
    if not user_stats:
        raise HTTPException(
            status_code=404, 
            detail="User stats not found. Create a transaction to initialize stats."
        )
    
    # Get user profile for hourly rate calculation
    profile_query = select(UserProfile).where(UserProfile.user_id == user_id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    hourly_rate = 0.0
    if profile:
        hourly_rate = calculate_hourly_rate(profile)
    
    # Calculate minutes to next level
    current_level_xp = (user_stats.level - 1) * 100
    xp_for_next_level = user_stats.level * 100
    xp_needed = xp_for_next_level - user_stats.xp
    minutes_to_next_level = int(xp_needed * 100 / hourly_rate * 60) if hourly_rate > 0 else 0
    
    # Calculate hours lost from minutes
    hours_lost = round(user_stats.total_minutes_lost / 60, 2)
    
    return UserStatsResponse(
        id=user_stats.id,
        user_id=user_stats.user_id,
        xp=user_stats.xp,
        level=user_stats.level,
        streak=user_stats.streak,
        total_minutes_lost=user_stats.total_minutes_lost,
        hours_lost=hours_lost,
        last_transaction_date=user_stats.last_transaction_date.isoformat() if user_stats.last_transaction_date else None,
        hourly_rate=hourly_rate,
        minutes_to_next_level=minutes_to_next_level
    )

@router.get("/", response_model=UserStatsResponse)
async def get_current_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stats for the current authenticated user"""
    return await get_user_stats(current_user.id, current_user, db) 