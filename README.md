# Financial Coach AI

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
- `GET /goals/` - Get goals with filtering
- `GET /goals/{id}` - Get specific goal
- `PATCH /goals/{id}` - Update goal
- `DELETE /goals/{id}` - Delete goal
- `GET /goals/{id}/progress` - Get goal progress
- `POST /goals/{id}/contribute` - Contribute to goal
- `GET /goals/user/{user_id}/overview` - Get user goals overview

### Analytics
- `GET /analytics/trends` - Get spending trends
- `GET /analytics/categories/insights` - Get category insights
- `GET /analytics/monthly-comparison` - Get monthly comparison
- `GET /analytics/spending-patterns` - Get spending patterns by day
- `GET /analytics/financial-health` - Get financial health metrics
- `GET /analytics/user/{user_id}/dashboard` - Get user dashboard

### Summary
- `GET /summary/` - Get financial summary
- `GET /summary/by-category/` - Get category breakdown
- `GET /summary/by-day/` - Get daily summaries

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# FastAPI app
APP_NAME=financial-coach
APP_PORT=8000

# PostgreSQL Database
POSTGRES_DB=finance_db
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=securepassword123
POSTGRES_HOST=db
POSTGRES_PORT=5432

# SQLAlchemy URL
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# Alembic
ALEMBIC_DB_URL=${DATABASE_URL}

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-this-in-production-environment
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Development

### Running migrations
```bash
# Generate a new migration
docker-compose exec financial_coach_api alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec financial_coach_api alembic upgrade head
```

### Adding new features
1. Update models in `backend/models.py`
2. Create new routes in `backend/routes/`
3. Add router to `backend/main.py`
4. Generate and apply migrations

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Protection**: SQLAlchemy ORM
- **CORS**: Configurable CORS middleware

## Production Deployment

1. **Change the SECRET_KEY** to a strong, random value
2. **Update CORS origins** to your frontend domain
3. **Use environment variables** for all sensitive data
4. **Enable HTTPS** in production
5. **Set up proper logging** and monitoring
6. **Configure database backups**

## API Documentation

The API documentation is automatically generated using FastAPI's built-in OpenAPI support. Access it at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. 