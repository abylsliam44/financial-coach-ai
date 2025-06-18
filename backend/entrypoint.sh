#!/bin/bash
set -e

echo "⏳ Waiting for PostgreSQL..."
python utils/wait_for_postgres.py

echo "🔄 Running Alembic migrations..."
alembic upgrade head

echo "🚀 Starting FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
