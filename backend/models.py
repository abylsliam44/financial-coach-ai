from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from data.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # One-to-one relationship with UserProfile
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # One-to-one relationship with UserStats
    stats = relationship("UserStats", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Персональные данные
    name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    
    # Доход
    monthly_income = Column(Integer, nullable=True)
    income_source = Column(String(100), nullable=True)
    income_stability = Column(Integer, nullable=True)  # 1-5
    
    # Расходы
    monthly_expenses = Column(Integer, nullable=True)
    spending_categories = Column(Text, nullable=True)  # JSON string
    
    # Цели
    goals = Column(Text, nullable=True)  # JSON string
    
    # Финансовая психология
    financial_confidence = Column(Integer, nullable=True)  # 1-5
    spending_impulsiveness = Column(Integer, nullable=True)  # 1-5
    financial_stress = Column(Integer, nullable=True)  # 1-5
    saving_frequency = Column(String(100), nullable=True)
    
    # Привычки
    tracks_expenses = Column(Boolean, nullable=True)
    used_financial_apps = Column(String(100), nullable=True)
    wants_motivation = Column(Boolean, nullable=True)
    
    # Старые поля (для обратной совместимости)
    weekly_hours = Column(Integer, default=40, nullable=True)
    weeks_per_month = Column(Integer, default=4, nullable=True)
    currency = Column(String(10), default="KZT", nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # One-to-one relationship with User
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, name={self.name})>"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String(10), nullable=False)  # "income" or "expense"
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, type={self.type}, category={self.category}, account_id={self.account_id})>"

class Category(Base):
    __tablename__ = "categories"
    
    name = Column(String(100), primary_key=True)
    is_default = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<Category(name={self.name}, is_default={self.is_default})>"

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String(20), nullable=False)  # "monthly", "weekly", "yearly"
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Budget(id={self.id}, category={self.category}, amount={self.amount}, period={self.period})>"

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=True)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Goal(id={self.id}, name={self.name}, target_amount={self.target_amount})>"

class UserStats(Base):
    __tablename__ = "user_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    streak = Column(Integer, default=0, nullable=False)
    total_minutes_lost = Column(Integer, default=0, nullable=False)
    last_transaction_date = Column(Date, nullable=True)
    
    # One-to-one relationship with User
    user = relationship("User", back_populates="stats")
    
    def __repr__(self):
        return f"<UserStats(id={self.id}, user_id={self.user_id}, level={self.level}, xp={self.xp})>"

class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    icon = Column(String(20), nullable=True)  # emoji или тип (card, wallet, deposit)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="accounts")

    def __repr__(self):
        return f"<Account(id={self.id}, name={self.name}, balance={self.balance}, icon={self.icon})>" 