#!/bin/bash

# Wait for the database to be ready
echo "Waiting for database..."
sleep 10

# Run database migrations
echo "Running Alembic migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 