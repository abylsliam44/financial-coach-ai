from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, Field
import uuid

from data.database import get_db
from models import Account, User
from auth.security import get_current_active_user

router = APIRouter(prefix="/accounts", tags=["accounts"])

class AccountCreate(BaseModel):
    name: str
    balance: float = 0.0
    icon: str = "💳"  # emoji или тип

class AccountUpdate(BaseModel):
    name: str = Field(...)
    balance: float = Field(...)
    icon: str = Field(...)

class AccountOut(BaseModel):
    id: uuid.UUID
    name: str
    balance: float
    icon: str

    class Config:
        orm_mode = True

@router.get("/", response_model=List[AccountOut])
async def get_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Account).where(Account.user_id == current_user.id))
    return result.scalars().all()

@router.post("/", response_model=AccountOut)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    account = Account(
        user_id=current_user.id,
        name=data.name,
        balance=data.balance,
        icon=data.icon
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account

@router.patch("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == current_user.id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.name = data.name
    account.balance = data.balance
    account.icon = data.icon
    await db.commit()
    await db.refresh(account)
    return account

@router.delete("/{account_id}")
async def delete_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == current_user.id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    await db.delete(account)
    await db.commit()
    return {"message": "Account deleted"} 