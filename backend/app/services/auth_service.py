from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.config import get_settings
from app.models.user import User

settings = get_settings()

# Password hashing context
# Use PBKDF2 here to avoid bcrypt backend compatibility issues in local dev.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(user_id: UUID, email: str) -> str:
        """Create a JWT access token."""
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
        to_encode = {
            "user_id": str(user_id),
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow(),
        }
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify a JWT token and return payload."""
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def register_user(email: str, password: str, db: Session) -> User:
        """Register a new user."""
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Create new user
        hashed_password = AuthService.hash_password(password)
        new_user = User(
            email=email,
            password_hash=hashed_password,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def login_user(email: str, password: str, db: Session) -> User:
        """Authenticate a user and return user object if valid."""
        user = db.query(User).filter(User.email == email).first()
        
        if not user or not AuthService.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
        
        return user
    
    @staticmethod
    def get_user_by_id(user_id: UUID, db: Session) -> Optional[User]:
        """Get a user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_google_id(google_id: str, db: Session) -> Optional[User]:
        """Get a user by Google ID."""
        return db.query(User).filter(User.google_id == google_id).first()
    
    @staticmethod
    def create_or_update_google_user(email: str, google_id: str, db: Session) -> User:
        """Create or update a user via Google OAuth."""
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if user:
            return user
        
        # Check if email exists (merge Google account with existing email)
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            existing_user.google_id = google_id
            db.add(existing_user)
            db.commit()
            db.refresh(existing_user)
            return existing_user
        
        # Create new user via Google OAuth
        new_user = User(
            email=email,
            google_id=google_id,
            password_hash="",  # No password for OAuth users
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
