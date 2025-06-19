from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel, Field
import uuid

from data.database import get_db
from models import User, UserProfile
from auth.security import get_current_active_user

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

class UserProfileCreate(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Monthly income in currency units", example=5000.0)
    weekly_hours: int = Field(..., gt=0, le=168, description="Weekly working hours (1-168)", example=40)
    weeks_per_month: int = Field(..., gt=0, le=5, description="Weeks per month (1-5)", example=4)
    currency: str = Field(default="KZT", max_length=10, description="Currency code", example="USD")

    class Config:
        schema_extra = {
            "example": {
                "monthly_income": 5000.0,
                "weekly_hours": 40,
                "weeks_per_month": 4,
                "currency": "USD"
            }
        }

class UserProfileUpdate(BaseModel):
    monthly_income: Optional[float] = Field(None, gt=0, description="Monthly income in currency units")
    weekly_hours: Optional[int] = Field(None, gt=0, le=168, description="Weekly working hours (1-168)")
    weeks_per_month: Optional[int] = Field(None, gt=0, le=5, description="Weeks per month (1-5)")
    currency: Optional[str] = Field(None, max_length=10, description="Currency code")

class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    monthly_income: float
    weekly_hours: int
    weeks_per_month: int
    currency: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=UserProfileResponse)
async def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user profile for the authenticated user
    
    - Users must provide their financial information manually
    - Only one profile per user is allowed
    - Required for gamification calculations
    """
    
    # Check if user already has a profile
    existing_profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    existing_profile_result = await db.execute(existing_profile_query)
    existing_profile = existing_profile_result.scalar_one_or_none()
    
    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="User profile already exists. Use PATCH /user-profile/ to update your profile."
        )
    
    # Validate weekly hours (reasonable working hours)
    if profile_data.weekly_hours > 80:
        raise HTTPException(
            status_code=400,
            detail="Weekly hours cannot exceed 80 hours. Please enter a realistic value."
        )
    
    # Validate weeks per month
    if profile_data.weeks_per_month > 5:
        raise HTTPException(
            status_code=400,
            detail="Weeks per month cannot exceed 5. Please enter a realistic value."
        )
    
    # Create new profile
    db_profile = UserProfile(
        user_id=current_user.id,
        monthly_income=profile_data.monthly_income,
        weekly_hours=profile_data.weekly_hours,
        weeks_per_month=profile_data.weeks_per_month,
        currency=profile_data.currency
    )
    
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    
    return UserProfileResponse(
        id=db_profile.id,
        user_id=db_profile.user_id,
        monthly_income=db_profile.monthly_income,
        weekly_hours=db_profile.weekly_hours,
        weeks_per_month=db_profile.weeks_per_month,
        currency=db_profile.currency
    )

@router.patch("/", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the existing user profile for the authenticated user
    
    - Accepts partial updates
    - Only updates provided fields
    - Maintains data integrity
    """
    
    # Get existing profile
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Please create your profile first using POST /user-profile/."
        )
    
    # Validate weekly hours if provided
    if profile_update.weekly_hours is not None and profile_update.weekly_hours > 80:
        raise HTTPException(
            status_code=400,
            detail="Weekly hours cannot exceed 80 hours. Please enter a realistic value."
        )
    
    # Validate weeks per month if provided
    if profile_update.weeks_per_month is not None and profile_update.weeks_per_month > 5:
        raise HTTPException(
            status_code=400,
            detail="Weeks per month cannot exceed 5. Please enter a realistic value."
        )
    
    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        monthly_income=profile.monthly_income,
        weekly_hours=profile.weekly_hours,
        weeks_per_month=profile.weeks_per_month,
        currency=profile.currency
    )

@router.get("/", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's profile
    
    Returns the complete profile information
    """
    
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found. Please create your profile first using POST /user-profile/."
        )
    
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        monthly_income=profile.monthly_income,
        weekly_hours=profile.weekly_hours,
        weeks_per_month=profile.weeks_per_month,
        currency=profile.currency
    )

@router.delete("/")
async def delete_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete the current user's profile
    
    Warning: This will affect gamification calculations
    """
    
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found."
        )
    
    await db.delete(profile)
    await db.commit()
    
    return {"message": "User profile deleted successfully"} 