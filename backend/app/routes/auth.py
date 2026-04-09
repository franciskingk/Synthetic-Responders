from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserResponse
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    user = AuthService.register_user(request.email, request.password, db)
    token = AuthService.create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
    }


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = AuthService.login_user(request.email, request.password, db)
    token = AuthService.create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
    }


@router.post("/google", response_model=AuthResponse)
def google_oauth(
    google_id: str,
    email: EmailStr,
    db: Session = Depends(get_db),
):
    """
    Exchange Google OAuth credentials for JWT token.
    
    In production, validate the Google ID token here.
    For MVP, trusting client-provided credentials.
    """
    user = AuthService.create_or_update_google_user(email, google_id, db)
    token = AuthService.create_access_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
    }
