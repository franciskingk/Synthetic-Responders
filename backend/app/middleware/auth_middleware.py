from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import AuthService

security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to extract and verify JWT token from Authorization header.
    Returns user_id from token payload.
    """
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )
    
    return user_id


def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to extract email from JWT token.
    """
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    email = payload.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )
    
    return email
