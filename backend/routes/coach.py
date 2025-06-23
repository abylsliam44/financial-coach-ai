from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from data.database import get_db
from models import User, Transaction, Goal
from services.ai_coach import get_financial_advice
from auth.security import get_current_user

router = APIRouter(prefix="/coach", tags=["coach"])

class CoachRequest(BaseModel):
    message: str

@router.post("/ask")
async def ask_coach(
    req: CoachRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get recent transactions
    tx_query = (
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .limit(10)
    )
    tx_result = await db.execute(tx_query)
    transactions = tx_result.scalars().all()
    
    # Get user goals
    goals_query = select(Goal).where(Goal.user_id == current_user.id, Goal.is_active == True)
    goals_result = await db.execute(goals_query)
    goals = goals_result.scalars().all()
    
    # Convert to dict for AI context
    user_dict = {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email
    }
    
    if current_user.profile:
        user_dict.update({
            "name": current_user.profile.name,
            "age": current_user.profile.age,
            # Add other profile fields if needed by the prompt
        })
    
    # Get AI advice stream
    advice_stream = get_financial_advice(user_dict, req.message, transactions, goals)
    
    return StreamingResponse(advice_stream, media_type="text/event-stream") 