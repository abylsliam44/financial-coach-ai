from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

from data.database import get_db
from models import Category
from categories import ALL_DEFAULT_CATEGORIES

router = APIRouter(prefix="/categories", tags=["categories"])

# Pydantic models
class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    name: str
    is_default: bool
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories (default and custom)"""
    query = select(Category).order_by(Category.name)
    result = await db.execute(query)
    categories = result.scalars().all()
    
    return categories

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a new custom category"""
    # Check if category already exists
    existing_query = select(Category).where(Category.name == category.name)
    existing_result = await db.execute(existing_query)
    existing_category = existing_result.scalar_one_or_none()
    
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    # Create new category
    db_category = Category(
        name=category.name,
        is_default=False
    )
    
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    
    return db_category

@router.delete("/{category_name}")
async def delete_category(
    category_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom category"""
    query = select(Category).where(Category.name == category_name)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
    
    await db.delete(category)
    await db.commit()
    
    return {"message": "Category deleted successfully"}

@router.post("/initialize-defaults")
async def initialize_default_categories(db: AsyncSession = Depends(get_db)):
    """Initialize default categories in the database"""
    # Check which default categories already exist
    existing_query = select(Category).where(Category.is_default == True)
    existing_result = await db.execute(existing_query)
    existing_categories = {cat.name for cat in existing_result.scalars().all()}
    
    # Add missing default categories
    categories_to_add = []
    for category_name in ALL_DEFAULT_CATEGORIES:
        if category_name not in existing_categories:
            categories_to_add.append(Category(name=category_name, is_default=True))
    
    if categories_to_add:
        db.add_all(categories_to_add)
        await db.commit()
    
    return {
        "message": f"Initialized {len(categories_to_add)} default categories",
        "categories_added": [cat.name for cat in categories_to_add]
    } 