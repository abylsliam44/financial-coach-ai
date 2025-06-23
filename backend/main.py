from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
import os
from dotenv import load_dotenv

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(summary.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(analytics.router)
app.include_router(coach.router)
app.include_router(user_stats.router)
app.include_router(gamification.router)
app.include_router(user_profile.router)
app.include_router(onboarding.router)
app.include_router(accounts_router)

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
            "auth": "/auth/",
            "users": "/users/",
            "transactions": "/transactions/",
            "summary": "/summary/",
            "categories": "/categories/",
            "budgets": "/budgets/",
            "goals": "/goals/",
            "analytics": "/analytics/",
            "coach": "/coach/",
            "user-stats": "/user-stats/",
            "gamification": "/gamification/",
            "user-profile": "/user-profile/"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "financial-coach-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 