from datetime import datetime
from uuid import uuid4
from typing import Optional
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, Text, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from app.db.base import Base


class Simulation(Base):
    """SQLAlchemy Simulation model."""
    __tablename__ = "simulations"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    persona_id = Column(Uuid(as_uuid=True), ForeignKey("personas.id", ondelete="CASCADE"), nullable=False, index=True)
    survey_id = Column(Uuid(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False, index=True)
    sample_size = Column(Integer, nullable=False)
    status = Column(String(50), default="running")  # "running", "complete", "failed"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="simulations")
    persona = relationship("Persona", back_populates="simulations")
    survey = relationship("Survey", back_populates="simulations")
    responses = relationship("Response", back_populates="simulation", cascade="all, delete-orphan")
    
    @property
    def total_responses(self) -> int:
        return len(self.responses) if self.responses else 0


# Pydantic schemas
class SimulationCreateRequest(BaseModel):
    persona_id: str
    survey_id: str
    sample_size: int = Field(ge=1, le=300)


class SimulationResponse(BaseModel):
    id: str
    user_id: str
    persona_id: str
    survey_id: str
    persona_name: Optional[str] = None
    survey_title: Optional[str] = None
    sample_size: int
    status: str
    total_responses: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SimulationListResponse(BaseModel):
    simulations: list[SimulationResponse]
    count: int
