# BaiAI

A comprehensive personal finance tracker API built with FastAPI, featuring user authentication, budgeting, goal tracking, and advanced analytics.

## Features

- 🔐 **Authentication**: JWT-based authentication with secure password hashing
- 👤 **User Management**: User registration, login, profile management
- 💰 **Transaction Tracking**: Income and expense tracking with categories
- 📊 **Financial Analytics**: Spending trends, category insights, financial health metrics
- 🎯 **Goal Setting**: Financial goals with progress tracking
- 💳 **Budget Management**: Category-based budgets with spending alerts
- 📈 **Advanced Analytics**: Monthly comparisons, spending patterns, user dashboards

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Migrations**: Alembic
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financial-coach
   ```

2. **Start the services**
   ```bash
   docker-compose up --build
   ```

3. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Authentication

### Register a new user
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Using the token
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `POST /auth/login/form` - Login with form data (Swagger UI)
- `GET /auth/me` - Get current user profile
- `POST /auth/change-password` - Change password
- `POST /auth/refresh` - Refresh access token

### Users
- `GET /users/` - Get all users (Admin)
- `GET /users/{user_id}` - Get user profile (own profile only)
- `PATCH /users/{user_id}` - Update user profile (own profile only)
- `DELETE /users/{user_id}` - Deactivate user (own account only)
- `GET /users/{user_id}/stats` - Get user financial stats
- `GET /users/{user_id}/profile` - Get complete user profile

### Transactions
- `POST /transactions/` - Create a transaction
- `GET /transactions/` - Get transactions with filtering
- `GET /transactions/{id}` - Get specific transaction
- `PATCH /transactions/{id}` - Update transaction
- `DELETE /transactions/{id}` - Delete transaction

### Categories
- `GET /categories/` - Get all categories
- `POST /categories/` - Create custom category
- `DELETE /categories/{name}` - Delete custom category
- `POST /categories/initialize-defaults` - Initialize default categories

### Budgets
- `POST /budgets/` - Create a budget
- `GET /budgets/` - Get budgets with filtering
- `GET /budgets/{id}` - Get specific budget
- `PATCH /budgets/{id}` - Update budget
- `DELETE /budgets/{id}` - Delete budget
- `GET /budgets/{id}/status` - Get budget status
- `GET /budgets/user/{user_id}/overview` - Get user budgets overview

### Goals
- `POST /goals/` - Create a financial goal
