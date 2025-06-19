from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel

from data.database import get_db
from models import User, UserStats, UserProfile
from auth.security import get_current_active_user
from services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])

class GamificationStatusResponse(BaseModel):
    level: int
    xp: int
    xp_to_next_level: int
    progress_percentage: int
    streak: int
    total_minutes_lost: int
    total_hours_lost: float
    hourly_rate: float
    message: str
    next_challenge_hint: str
    streak_insights: Dict[str, Any]
    last_transaction_date: str = None

@router.get("/status", response_model=GamificationStatusResponse)
async def get_gamification_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive gamification status for the authenticated user
    
    Returns:
    - Level, XP, and progress information
    - Streak and time tracking
    - Motivational messages and challenge hints
    - Detailed streak insights
    """
    
    # Get user stats
    stats_query = select(UserStats).where(UserStats.user_id == current_user.id)
    stats_result = await db.execute(stats_query)
    user_stats = stats_result.scalar_one_or_none()
    
    if not user_stats:
        raise HTTPException(
            status_code=404,
            detail="User stats not found. Create a transaction to initialize your gamification profile."
        )
    
    # Get user profile
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    user_profile = profile_result.scalar_one_or_none()
    
    if not user_profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Please complete your profile setup."
        )
    
    # Calculate gamification status using the service
    status = GamificationService.calculate_gamification_status(user_stats, user_profile)
    
    return GamificationStatusResponse(**status)

@router.get("/quick-stats")
async def get_quick_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get quick gamification stats for dashboard widgets
    
    Returns minimal stats for quick display
    """
    
    # Get user stats
    stats_query = select(UserStats).where(UserStats.user_id == current_user.id)
    stats_result = await db.execute(stats_query)
    user_stats = stats_result.scalar_one_or_none()
    
    if not user_stats:
        return {
            "level": 1,
            "xp": 0,
            "streak": 0,
            "total_hours_lost": 0,
            "has_profile": False
        }
    
    # Get user profile for hourly rate
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    user_profile = profile_result.scalar_one_or_none()
    
    total_hours_lost = round(user_stats.total_minutes_lost / 60, 2)
    
    return {
        "level": user_stats.level,
        "xp": user_stats.xp,
        "streak": user_stats.streak,
        "total_hours_lost": total_hours_lost,
        "has_profile": user_profile is not None,
        "last_transaction_date": user_stats.last_transaction_date.isoformat() if user_stats.last_transaction_date else None
    } 