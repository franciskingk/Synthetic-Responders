"""
Synthetic Research Lab - Backend API

This is the backend API for the Synthetic Research Lab SaaS platform.

Installation:
    pip install -r requirements.txt

Configuration:
    1. Create .env file from .env.example
    2. Set DATABASE_URL to your Supabase PostgreSQL URL
    3. Set JWT_SECRET_KEY to a secure random string
    4. Set LLM API keys (GROQ_API_KEY, etc.)

Running:
    python -m uvicorn main:app --reload

Database:
    python -c "from app.db.init_db import init_db; init_db()"

API Documentation:
    http://localhost:8000/docs
    http://localhost:8000/redoc
"""
