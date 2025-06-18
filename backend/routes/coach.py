from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Dict, Any

from data.database import get_db
from models import User, Transaction, Goal
from services.ai_coach import get_financial_advice

router = APIRouter(prefix="/coach", tags=["coach"])

class CoachRequest(BaseModel):
    user_id: str
    message: str

class CoachResponse(BaseModel):
    advice: str

@router.post("/ask", response_model=CoachResponse)
async def ask_coach(
    req: CoachRequest,
    db: AsyncSession = Depends(get_db)
):
    # Get user
    user_query = select(User).where(User.id == req.user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get recent transactions (last 10)
    tx_query = select(Transaction).where(Transaction.type.in_(["income", "expense"])) \
        .order_by(Transaction.date.desc()).limit(10)
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

    # Get user goals (mock if not implemented)
    try:
        goal_query = select(Goal).where(Goal.user_id == req.user_id)
        goal_result = await db.execute(goal_query)
        goals = [
            {
                "name": g.name,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "target_date": g.target_date.isoformat() if g.target_date else None
            } for g in goal_result.scalars().all()
        ]
    except Exception:
        goals = []

    # Prepare user dict
    user_dict = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email
    }

    # Get AI advice
    advice = await get_financial_advice(user_dict, req.message, transactions, goals)
    return CoachResponse(advice=advice) 