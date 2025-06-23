from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
import uuid

from data.database import get_db
from models import Transaction, User, UserProfile, UserStats, Account
from auth.security import get_current_active_user
from utils.filters import apply_transaction_filters
from utils.gamification import update_user_stats

router = APIRouter(prefix="/transactions", tags=["transactions"])

# Pydantic models for request/response
class TransactionCreate(BaseModel):
    amount: float = Field(..., description="Transaction amount", example=1000.0)
    type: str = Field(..., description="Type of transaction: 'income' or 'expense'", example="expense")
    category: str = Field(..., description="Transaction category", example="Charity")
    description: Optional[str] = Field(None, description="Description of the transaction", example="Donation to charity")
    date: Optional[datetime] = Field(None, description="Transaction date (ISO 8601)", example="2025-06-19T10:52:00Z")
    account_id: Optional[uuid.UUID] = Field(None, description="Account ID for this transaction")

    class Config:
        schema_extra = {
            "example": {
                "amount": 1000.0,
                "type": "expense",
                "category": "Charity",
                "description": "Donation to charity",
                "date": "2025-06-19T10:52:00Z"
            }
        }

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    account_id: Optional[uuid.UUID] = None

class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: float
    type: str
    category: str
    description: Optional[str]
    date: datetime
    account_id: Optional[uuid.UUID]
    
    class Config:
        from_attributes = True

class TransactionWithStatsResponse(BaseModel):
    transaction: TransactionResponse
    xp_gained: int
    minutes_lost: int
    level_gained: int
    new_level: int
    new_streak: int

@router.post("/", response_model=TransactionWithStatsResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction with gamification updates and update account balance"""
    if transaction.type.lower() not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")
    if not transaction.account_id:
        raise HTTPException(status_code=400, detail="Account must be selected")

    # Get account
    account_query = select(Account).where(Account.id == transaction.account_id, Account.user_id == current_user.id)
    account_result = await db.execute(account_query)
    account = account_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Get or create user profile
    profile_query = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile_result = await db.execute(profile_query)
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=400, 
            detail="User profile not found. Please complete your profile setup first using POST /user-profile/."
        )

    # Get or create user stats
    stats_query = select(UserStats).where(UserStats.user_id == current_user.id)
    stats_result = await db.execute(stats_query)
    user_stats = stats_result.scalar_one_or_none()
    if not user_stats:
        user_stats = UserStats(user_id=current_user.id)
        db.add(user_stats)
        await db.flush()

    # Create transaction
    db_transaction = Transaction(
        user_id=current_user.id,
        amount=transaction.amount,
        type=transaction.type.lower(),
        category=transaction.category,
        description=transaction.description,
        date=transaction.date or datetime.now(),
        account_id=transaction.account_id
    )
    db.add(db_transaction)
    await db.flush()

    # Update account balance
    if transaction.type.lower() == "income":
        account.balance += transaction.amount
    else:
        account.balance -= transaction.amount
    db.add(account)

    # Update gamification stats (only for expenses)
    xp_gained = 0
    minutes_lost = 0
    level_gained = 0
    if transaction.type.lower() == "expense":
        transaction_date = db_transaction.date.date()
        xp_gained, minutes_lost, level_gained = update_user_stats(
            user_stats, profile, transaction.amount, transaction_date
        )

    await db.commit()
    await db.refresh(db_transaction)
    await db.refresh(user_stats)
    await db.refresh(account)

    return TransactionWithStatsResponse(
        transaction=TransactionResponse(
            id=db_transaction.id,
            user_id=db_transaction.user_id,
            amount=db_transaction.amount,
            type=db_transaction.type,
            category=db_transaction.category,
            description=db_transaction.description,
            date=db_transaction.date,
            account_id=db_transaction.account_id
        ),
        xp_gained=xp_gained,
        minutes_lost=minutes_lost,
        level_gained=level_gained,
        new_level=user_stats.level,
        new_streak=user_stats.streak
    )

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    type: Optional[str] = Query(None, description="Filter by 'income' or 'expense'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search in description and category"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions for the current user with optional filtering"""
    query = select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.date.desc())
    
    # Apply filters
    query = apply_transaction_filters(
        query,
        transaction_type=type,
        category=category,
        start_date=start_date,
        end_date=end_date,
        search_text=search
    )
    
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return transactions

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific transaction by ID (only if owned by current user)"""
    query = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    transaction_update: TransactionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction (only if owned by current user) and update account balances"""
    query = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Save old values
    old_amount = transaction.amount
    old_type = transaction.type
    old_account_id = transaction.account_id

    # Validate type if provided
    if transaction_update.type and transaction_update.type.lower() not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")

    # Update fields
    update_data = transaction_update.dict(exclude_unset=True)
    if "type" in update_data:
        update_data["type"] = update_data["type"].lower()

    for field, value in update_data.items():
        setattr(transaction, field, value)

    # Корректируем балансы счетов
    # 1. Откатываем старую транзакцию
    if old_account_id:
        old_account_query = select(Account).where(Account.id == old_account_id, Account.user_id == current_user.id)
        old_account_result = await db.execute(old_account_query)
        old_account = old_account_result.scalar_one_or_none()
        if old_account:
            if old_type == "income":
                old_account.balance -= old_amount
            else:
                old_account.balance += old_amount
            db.add(old_account)

    # 2. Применяем новую транзакцию
    new_account_id = transaction.account_id
    new_type = transaction.type
    new_amount = transaction.amount
    if new_account_id:
        new_account_query = select(Account).where(Account.id == new_account_id, Account.user_id == current_user.id)
        new_account_result = await db.execute(new_account_query)
        new_account = new_account_result.scalar_one_or_none()
        if new_account:
            if new_type == "income":
                new_account.balance += new_amount
            else:
                new_account.balance -= new_amount
            db.add(new_account)

    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction (only if owned by current user) and update account balance"""
    query = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Откатываем транзакцию с баланса счета
    if transaction.account_id:
        account_query = select(Account).where(Account.id == transaction.account_id, Account.user_id == current_user.id)
        account_result = await db.execute(account_query)
        account = account_result.scalar_one_or_none()
        if account:
            if transaction.type == "income":
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount
            db.add(account)

    await db.delete(transaction)
    await db.commit()
    return {"message": "Transaction deleted successfully"} 