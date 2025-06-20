from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
import json

from data.database import get_db
from models import User, UserProfile
from auth.security import get_current_active_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class OnboardingData(BaseModel):
    # Персональные данные
    name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., max_length=50)
    
    # Доход
    monthly_income: int = Field(..., ge=0)
    income_source: str = Field(..., max_length=100)
    income_stability: int = Field(..., ge=1, le=5)
    
    # Расходы
    monthly_expenses: int = Field(..., ge=0)
    spending_categories: List[str] = Field(..., min_items=1)
    
    # Цели
    goals: List[str] = Field(..., min_items=1)
    
    # Финансовая психология
    financial_confidence: int = Field(..., ge=1, le=5)
    spending_impulsiveness: int = Field(..., ge=1, le=5)
    financial_stress: int = Field(..., ge=1, le=5)
    saving_frequency: str = Field(..., max_length=100)
    
    # Привычки
    tracks_expenses: bool
    used_financial_apps: str = Field(..., max_length=100)
    wants_motivation: bool

class OnboardingStatusResponse(BaseModel):
    has_profile: bool

@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Проверяет, есть ли у пользователя профиль
    """
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    return OnboardingStatusResponse(has_profile=profile is not None)

@router.post("/")
async def create_onboarding_profile(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Создает профиль пользователя на основе данных онбординга
    """
    # Проверяем, есть ли уже профиль
    existing_profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    existing_profile_result = await db.execute(existing_profile_query)
    existing_profile = existing_profile_result.scalar_one_or_none()
    
    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Профиль пользователя уже существует"
        )
    
    # Создаем новый профиль
    db_profile = UserProfile(
        user_id=current_user.id,
        name=onboarding_data.name,
        age=onboarding_data.age,
        gender=onboarding_data.gender,
        monthly_income=onboarding_data.monthly_income,
        income_source=onboarding_data.income_source,
        income_stability=onboarding_data.income_stability,
        monthly_expenses=onboarding_data.monthly_expenses,
        spending_categories=json.dumps(onboarding_data.spending_categories),
        goals=json.dumps(onboarding_data.goals),
        financial_confidence=onboarding_data.financial_confidence,
        spending_impulsiveness=onboarding_data.spending_impulsiveness,
        financial_stress=onboarding_data.financial_stress,
        saving_frequency=onboarding_data.saving_frequency,
        tracks_expenses=onboarding_data.tracks_expenses,
        used_financial_apps=onboarding_data.used_financial_apps,
        wants_motivation=onboarding_data.wants_motivation
    )
    
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    
    return {"message": "Профиль успешно создан", "profile_id": str(db_profile.id)} 