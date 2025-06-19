from datetime import date
from typing import Tuple
from models import UserProfile, UserStats

def calculate_hourly_rate(profile: UserProfile) -> float:
    """Calculate hourly rate from monthly income and work hours"""
    if profile.weekly_hours <= 0 or profile.weeks_per_month <= 0:
        return 0.0
    
    monthly_hours = profile.weekly_hours * profile.weeks_per_month
    return profile.monthly_income / monthly_hours

def calculate_lost_minutes(amount: float, hourly_rate: float) -> int:
    """Convert spending amount to minutes of work lost"""
    if hourly_rate <= 0:
        return 0
    
    return int((amount / hourly_rate) * 60)

def calculate_xp_gain(amount: float) -> int:
    """Calculate XP gained from transaction amount"""
    # XP = amount / 100 (rounded down)
    return int(amount / 100)

def calculate_level(xp: int) -> int:
    """Calculate level based on XP"""
    # Level = XP / 100 + 1
    return (xp // 100) + 1

def update_user_stats(
    user_stats: UserStats,
    profile: UserProfile,
    amount: float,
    transaction_date: date
) -> Tuple[int, int, int]:
    """
    Update user stats based on a new transaction
    
    Returns:
        Tuple of (xp_gained, minutes_lost, new_level)
    """
    # Calculate hourly rate and lost minutes
    hourly_rate = calculate_hourly_rate(profile)
    minutes_lost = calculate_lost_minutes(amount, hourly_rate)
    
    # Calculate XP gain
    xp_gained = calculate_xp_gain(amount)
    
    # Update XP and level
    user_stats.xp += xp_gained
    new_level = calculate_level(user_stats.xp)
    level_gained = new_level - user_stats.level
    user_stats.level = new_level
    
    # Update total minutes lost
    user_stats.total_minutes_lost += minutes_lost
    
    # Update streak
    if user_stats.last_transaction_date is None:
        # First transaction
        user_stats.streak = 1
    elif transaction_date == user_stats.last_transaction_date:
        # Same day transaction - no streak change
        pass
    elif transaction_date == user_stats.last_transaction_date + date.resolution:
        # Consecutive day - increment streak
        user_stats.streak += 1
    else:
        # Missed a day - reset streak
        user_stats.streak = 1
    
    # Update last transaction date
    user_stats.last_transaction_date = transaction_date
    
    return xp_gained, minutes_lost, level_gained 