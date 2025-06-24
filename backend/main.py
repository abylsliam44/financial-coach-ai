from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

from data.database import get_db, engine
from models import Base
from routes import transactions, summary, categories, users, budgets, goals, analytics, auth, coach, user_stats, gamification, user_profile, onboarding
from routes.accounts import router as accounts_router

load_dotenv()

app = FastAPI(
    title="Financial Coach AI",
    description="A comprehensive personal finance tracker API with user management, budgeting, goal tracking, authentication, and AI coaching",
    version="1.0.0"
)

# Create API router with /api prefix
api_router = APIRouter()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers in api_router
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(transactions.router)
api_router.include_router(summary.router)
api_router.include_router(categories.router)
api_router.include_router(budgets.router)
api_router.include_router(goals.router)
api_router.include_router(analytics.router)
api_router.include_router(coach.router)
api_router.include_router(user_stats.router)
api_router.include_router(gamification.router)
api_router.include_router(user_profile.router)
api_router.include_router(onboarding.router)
api_router.include_router(accounts_router)

# Include api_router with /api prefix
app.include_router(api_router, prefix="/api")

os.makedirs("backend/uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

@app.on_event("startup")
async def startup_event():
    """Initialize database and default categories on startup"""
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created successfully")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Financial Coach AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth/",
            "users": "/api/users/",
            "transactions": "/api/transactions/",
            "summary": "/api/summary/",
            "categories": "/api/categories/",
            "budgets": "/api/budgets/",
            "goals": "/api/goals/",
            "analytics": "/api/analytics/",
            "coach": "/api/coach/",
            "user-stats": "/api/user-stats/",
            "gamification": "/api/gamification/",
            "user-profile": "/api/user-profile/",
            "accounts": "/api/accounts/"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "financial-coach-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 