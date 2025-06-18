from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
import uuid

from data.database import get_db
from models import Transaction
from utils.filters import apply_transaction_filters

router = APIRouter(prefix="/transactions", tags=["transactions"])

# Pydantic models for request/response
class TransactionCreate(BaseModel):
    amount: float
    type: str  # "income" or "expense"
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: uuid.UUID
    amount: float
    type: str
    category: str
    description: Optional[str]
    date: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    if transaction.type.lower() not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")
    
    db_transaction = Transaction(
        amount=transaction.amount,
        type=transaction.type.lower(),
        category=transaction.category,
        description=transaction.description,
        date=transaction.date
    )
    
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    
    return db_transaction

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    type: Optional[str] = Query(None, description="Filter by 'income' or 'expense'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter until date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search in description and category"),
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions with optional filtering"""
    query = select(Transaction).order_by(Transaction.date.desc())
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get a specific transaction by ID"""
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    transaction_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Validate type if provided
    if transaction_update.type and transaction_update.type.lower() not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")
    
    # Update fields
    update_data = transaction_update.dict(exclude_unset=True)
    if "type" in update_data:
        update_data["type"] = update_data["type"].lower()
    
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    await db.commit()
    await db.refresh(transaction)
    
    return transaction

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.delete(transaction)
    await db.commit()
    
    return {"message": "Transaction deleted successfully"} 