from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import MetaData, create_engine
import os
from dotenv import load_dotenv

load_dotenv()

# Convert PostgreSQL URL to async
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://finance_user:securepassword123@db:5432/finance_db")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,
    future=True
)

# Create sync engine for migrations
sync_engine = create_engine(
    DATABASE_URL,
    echo=True
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 