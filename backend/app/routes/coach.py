from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.services.ai_coach import ai_coach_service
from app.crud.users import get_user_by_id
from app.crud.goals import get_user_goals
from app.crud.budgets import get_user_budgets

router = APIRouter(prefix="/coach", tags=["coach"])

class CoachRequest(BaseModel):
    user_id: UUID
    message: str

class CoachResponse(BaseModel):
    advice: str

@router.post("/ask", response_model=CoachResponse)
async def ask_coach(
    request: CoachRequest,
    db: AsyncSession = Depends(get_db)
) -> CoachResponse:
    # Verify user exists and get their profile
    user = await get_user_by_id(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's financial goals
    goals = await get_user_goals(db, request.user_id)
    goal_summaries = [f"{goal.name}: ${goal.target_amount}" for goal in goals]

    # Get user's budgets
    budgets = await get_user_budgets(db, request.user_id)
    total_budget = sum(budget.amount for budget in budgets)

    # Create user profile context
    user_profile = {
        "monthly_income": total_budget,  # Using total budget as a proxy for income
        "savings_goal": sum(goal.target_amount for goal in goals),
        "current_savings": sum(goal.current_amount for goal in goals),
        "financial_goals": ", ".join(goal_summaries) if goal_summaries else "No goals set"
    }

    try:
        advice = await ai_coach_service.get_financial_advice(request.message, user_profile)
        return CoachResponse(advice=advice)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="AI service is not available. Please contact support."
        ) 