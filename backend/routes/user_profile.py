from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
import json
import os
import shutil

from data.database import get_db
from models import User, UserProfile
from auth.security import get_current_active_user

router = APIRouter(prefix="/user-profile", tags=["user-profile"])

# Директория для загрузки фото
UPLOAD_DIRECTORY = "./uploads/avatars"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

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
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    monthly_income: Optional[int] = None
    income_source: Optional[str] = None
    income_stability: Optional[int] = Field(None, ge=1, le=5)
    monthly_expenses: Optional[int] = None
    spending_categories: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    financial_confidence: Optional[int] = Field(None, ge=1, le=5)
    spending_impulsiveness: Optional[int] = Field(None, ge=1, le=5)
    financial_stress: Optional[int] = Field(None, ge=1, le=5)
    saving_frequency: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    monthly_income: Optional[int] = None
    income_source: Optional[str] = None
    income_stability: Optional[int] = None
    monthly_expenses: Optional[int] = None
    spending_categories: Optional[List[str]] = []
    goals: Optional[List[str]] = []
    financial_confidence: Optional[int] = None
    spending_impulsiveness: Optional[int] = None
    financial_stress: Optional[int] = None
    saving_frequency: Optional[str] = None
    profile_photo_url: Optional[str] = None
    user: dict

    class Config:
        from_attributes = True
        
    def __init__(self, **data):
        # Преобразование JSON строк в списки
        if isinstance(data.get('spending_categories'), str):
            data['spending_categories'] = json.loads(data['spending_categories'])
        if isinstance(data.get('goals'), str):
            data['goals'] = json.loads(data['goals'])
        super().__init__(**data)

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
        currency=db_profile.currency,
        user={
            'email': current_user.email,
            'username': current_user.username,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None
        }
    )

@router.patch("/", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Обновить профиль текущего пользователя.
    Принимает частичные данные для обновления.
    """
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден.")

    update_data = profile_update.dict(exclude_unset=True)
    
    # Преобразование списков в JSON-строки
    if 'spending_categories' in update_data:
        update_data['spending_categories'] = json.dumps(update_data['spending_categories'])
    if 'goals' in update_data:
        update_data['goals'] = json.dumps(update_data['goals'])

    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)

    profile_data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_data['profile_photo_url'] = f"/uploads/avatars/{profile.user_id}.jpg" if os.path.exists(f"{UPLOAD_DIRECTORY}/{profile.user_id}.jpg") else None
    profile_data['user'] = {
        'email': current_user.email,
        'username': current_user.username,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    }
    return UserProfileResponse(**profile_data)

@router.get("/", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить профиль текущего пользователя.
    Возвращает полную информацию о профиле, включая ссылку на фото и данные пользователя.
    """
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Профиль пользователя не найден. Сначала завершите онбординг."
        )
    
    # Преобразование объекта SQLAlchemy в словарь
    profile_data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    
    # Добавляем URL фото профиля
    profile_data['profile_photo_url'] = f"/uploads/avatars/{profile.user_id}.jpg" if os.path.exists(f"{UPLOAD_DIRECTORY}/{profile.user_id}.jpg") else None

    # Добавляем данные пользователя
    profile_data['user'] = {
        'email': current_user.email,
        'username': current_user.username,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    }

    return UserProfileResponse(**profile_data)

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

@router.post("/photo", response_model=UserProfileResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Загрузить или обновить фото профиля (аватар).
    """
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден, сначала создайте его.")

    # Проверка типа файла
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Неверный формат файла. Используйте JPG или PNG.")
        
    # Сохраняем файл с именем user_id
    file_extension = ".jpg" if file.content_type == "image/jpeg" else ".png"
    file_path = os.path.join(UPLOAD_DIRECTORY, f"{profile.user_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Обновляем URL в базе (опционально, если храним)
    # setattr(profile, 'profile_photo_url', file_path) # Пример
    await db.commit()
    await db.refresh(profile)

    profile_data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_data['profile_photo_url'] = f"/uploads/avatars/{profile.user_id}{file_extension}"
    profile_data['user'] = {
        'email': current_user.email,
        'username': current_user.username,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    }
    return UserProfileResponse(**profile_data)

@router.delete("/photo", response_model=UserProfileResponse)
async def delete_profile_photo(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Удалить фото профиля (аватар).
    """
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден.")

    # Удаляем оба возможных файла (jpg и png)
    removed = False
    for ext in [".jpg", ".png"]:
        file_path = os.path.join(UPLOAD_DIRECTORY, f"{profile.user_id}{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)
            removed = True
    if not removed:
        # Если файлов не было, не считаем это ошибкой
        pass

    await db.commit()
    await db.refresh(profile)

    profile_data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_data['profile_photo_url'] = None
    profile_data['user'] = {
        'email': current_user.email,
        'username': current_user.username,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    }
    return UserProfileResponse(**profile_data)

# Роут для отдачи статичных файлов (аватаров)
from fastapi.staticfiles import StaticFiles
router.mount("/uploads", StaticFiles(directory="uploads"), name="uploads") 