from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, DateTime, func, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, Field
from app.db.base import Base


class User(Base):
    """SQLAlchemy User model."""
    __tablename__ = "users"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    google_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")
    surveys = relationship("Survey", back_populates="user", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="user", cascade="all, delete-orphan")


# Pydantic schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True
