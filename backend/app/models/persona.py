from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, field_validator
from app.db.base import Base


class Persona(Base):
    """SQLAlchemy Persona model."""
    __tablename__ = "personas"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Demographics
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    income_band = Column(String(100), nullable=False)
    education_level = Column(String(50), nullable=False)
    
    # Psychographics (0-1 float)
    risk_tolerance = Column(Float, nullable=False)
    brand_loyalty = Column(Float, nullable=False)
    price_sensitivity = Column(Float, nullable=False)
    innovation_openness = Column(Float, nullable=False)
    trust_in_institutions = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="personas")
    simulations = relationship("Simulation", back_populates="persona", cascade="all, delete-orphan")


# Pydantic schemas
class PersonaDemographicsSchema(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    age: int = Field(ge=18, le=100)
    gender: str = Field(pattern="^(M|F|Other)$")
    location: str = Field(min_length=1, max_length=255)
    income_band: str
    education_level: str


class PersonaPsychographicsSchema(BaseModel):
    risk_tolerance: float = Field(ge=0.0, le=1.0)
    brand_loyalty: float = Field(ge=0.0, le=1.0)
    price_sensitivity: float = Field(ge=0.0, le=1.0)
    innovation_openness: float = Field(ge=0.0, le=1.0)
    trust_in_institutions: float = Field(ge=0.0, le=1.0)
    
    @field_validator('*', mode='before')
    @classmethod
    def clamp_values(cls, v):
        """Clamp psychographic values to [0, 1]."""
        if isinstance(v, (int, float)):
            return max(0.0, min(1.0, float(v)))
        return v


class PersonaCreateRequest(BaseModel):
    demographics: PersonaDemographicsSchema
    psychographics: PersonaPsychographicsSchema


class PersonaUpdateRequest(BaseModel):
    demographics: PersonaDemographicsSchema | None = None
    psychographics: PersonaPsychographicsSchema | None = None


class PersonaResponse(BaseModel):
    id: str
    user_id: str
    demographics: PersonaDemographicsSchema
    psychographics: PersonaPsychographicsSchema
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PersonaListResponse(BaseModel):
    personas: list[PersonaResponse]
    count: int
