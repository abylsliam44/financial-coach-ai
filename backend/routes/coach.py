from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Dict, Any

from data.database import get_db
from models import User, Transaction, Goal
from services.ai_coach import get_financial_advice, build_user_context
from auth.security import get_current_user

router = APIRouter(prefix="/coach", tags=["coach"])

class CoachRequest(BaseModel):
    message: str

class CoachResponse(BaseModel):
    advice: str

@router.post("/ask", response_model=CoachResponse)
async def ask_coach(
    req: CoachRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get recent transactions (last 10, for this user)
    tx_query = (
        select(Transaction)
        .where(Transaction.type.in_(["income", "expense"]))
        .order_by(Transaction.date.desc())
        .limit(10)
    )
    tx_result = await db.execute(tx_query)
    transactions = [
        {
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "description": t.description,
            "date": t.date.isoformat()
        } for t in tx_result.scalars().all()
    ]

    # Get active goals for this user
    goal_query = select(Goal).where(Goal.user_id == current_user.id, Goal.is_active == True)
    goal_result = await db.execute(goal_query)
    goals = [
        {
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "target_date": g.target_date.isoformat() if g.target_date else None
        } for g in goal_result.scalars().all()
    ]

    # Prepare user dict
    user_dict = {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email
    }

    # Build context
    context = build_user_context(user_dict, transactions, goals)

    # Get AI advice
    advice = await get_financial_advice(user_dict, req.message, transactions, goals)
    return CoachResponse(advice=advice) 