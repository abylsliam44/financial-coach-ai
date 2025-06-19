from datetime import date, timedelta
from typing import Dict, Any, List
from models import UserStats, UserProfile
from utils.gamification import calculate_hourly_rate

class GamificationService:
    """Service for gamification calculations and insights"""
    
    @staticmethod
    def calculate_gamification_status(user_stats: UserStats, user_profile: UserProfile) -> Dict[str, Any]:
        """Calculate complete gamification status for a user"""
        
        # Basic calculations
        hourly_rate = calculate_hourly_rate(user_profile)
        xp_to_next_level = (user_stats.level * 100) - user_stats.xp
        total_hours_lost = round(user_stats.total_minutes_lost / 60, 2)
        
        # Calculate progress percentage to next level
        progress_percentage = 0
        if user_stats.level > 1:
            current_level_xp = (user_stats.level - 1) * 100
            xp_in_current_level = user_stats.xp - current_level_xp
            progress_percentage = min(100, int((xp_in_current_level / 100) * 100))
        
        # Generate motivational message
        message = GamificationService._generate_motivational_message(
            user_stats, xp_to_next_level, progress_percentage
        )
        
        # Generate next challenge hint
        next_challenge = GamificationService._generate_challenge_hint(user_stats, user_profile)
        
        # Calculate streak insights
        streak_insights = GamificationService._calculate_streak_insights(user_stats)
        
        return {
            "level": user_stats.level,
            "xp": user_stats.xp,
            "xp_to_next_level": xp_to_next_level,
            "progress_percentage": progress_percentage,
            "streak": user_stats.streak,
            "total_minutes_lost": user_stats.total_minutes_lost,
            "total_hours_lost": total_hours_lost,
            "hourly_rate": round(hourly_rate, 2),
            "message": message,
            "next_challenge_hint": next_challenge,
            "streak_insights": streak_insights,
            "last_transaction_date": user_stats.last_transaction_date.isoformat() if user_stats.last_transaction_date else None
        }
    
    @staticmethod
    def _generate_motivational_message(user_stats: UserStats, xp_to_next_level: int, progress_percentage: int) -> str:
        """Generate a motivational message based on user's current status"""
        
        messages = []
        
        # Level progress messages
        if xp_to_next_level <= 10:
            messages.append(f"🔥 Almost there! Only {xp_to_next_level} XP to level {user_stats.level + 1}!")
        elif xp_to_next_level <= 25:
            messages.append(f"💪 Great progress! {xp_to_next_level} XP to go for level {user_stats.level + 1}.")
        elif progress_percentage >= 75:
            messages.append(f"⭐ You're {progress_percentage}% to level {user_stats.level + 1}!")
        elif progress_percentage >= 50:
            messages.append(f"🎯 Halfway to level {user_stats.level + 1}!")
        else:
            messages.append(f"🚀 Level {user_stats.level} achieved! Keep going!")
        
        # Streak messages
        if user_stats.streak >= 7:
            messages.append(f"🔥 Amazing! {user_stats.streak}-day streak!")
        elif user_stats.streak >= 3:
            messages.append(f"⭐ Nice! {user_stats.streak}-day streak!")
        elif user_stats.streak == 1:
            messages.append("🌱 Starting your streak!")
        
        # XP milestone messages
        if user_stats.xp >= 1000:
            messages.append("🏆 XP Master! Over 1000 XP!")
        elif user_stats.xp >= 500:
            messages.append("💎 Diamond level XP!")
        elif user_stats.xp >= 100:
            messages.append("🌟 Century XP club!")
        
        # Return the most relevant message (prioritize level progress)
        return messages[0] if messages else "🎉 Keep up the great work!"
    
    @staticmethod
    def _generate_challenge_hint(user_stats: UserStats, user_profile: UserProfile) -> str:
        """Generate a personalized challenge hint"""
        
        challenges = []
        
        # Streak challenges
        if user_stats.streak < 3:
            challenges.append("Try a 3-day streak!")
        elif user_stats.streak < 7:
            challenges.append("Aim for a week-long streak!")
        else:
            challenges.append("Maintain your amazing streak!")
        
        # Spending challenges based on hourly rate
        hourly_rate = calculate_hourly_rate(user_profile)
        if hourly_rate > 0:
            # Suggest saving challenges
            daily_spending_limit = hourly_rate * 2  # 2 hours of work
            challenges.append(f"Try spending less than ${daily_spending_limit:.0f} today!")
        
        # Level challenges
        if user_stats.xp < 100:
            challenges.append("Reach 100 XP for your first milestone!")
        elif user_stats.xp < 500:
            challenges.append("Aim for 500 XP!")
        
        # Return a random challenge or the first one
        return challenges[0] if challenges else "Set a personal spending goal today!"
    
    @staticmethod
    def _calculate_streak_insights(user_stats: UserStats) -> Dict[str, Any]:
        """Calculate insights about the user's streak"""
        
        insights = {
            "current_streak": user_stats.streak,
            "best_streak": user_stats.streak,  # We'd need to track this in the future
            "streak_rank": "Beginner"
        }
        
        # Determine streak rank
        if user_stats.streak >= 30:
            insights["streak_rank"] = "Legendary"
        elif user_stats.streak >= 14:
            insights["streak_rank"] = "Master"
        elif user_stats.streak >= 7:
            insights["streak_rank"] = "Advanced"
        elif user_stats.streak >= 3:
            insights["streak_rank"] = "Intermediate"
        else:
            insights["streak_rank"] = "Beginner"
        
        # Calculate days since last transaction
        if user_stats.last_transaction_date:
            days_since = (date.today() - user_stats.last_transaction_date).days
            insights["days_since_last_transaction"] = days_since
            
            if days_since == 0:
                insights["status"] = "Active today"
            elif days_since == 1:
                insights["status"] = "Yesterday"
            elif days_since <= 3:
                insights["status"] = "Recent"
            else:
                insights["status"] = "Needs attention"
        else:
            insights["days_since_last_transaction"] = None
            insights["status"] = "No transactions yet"
        
        return insights 