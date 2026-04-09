from datetime import datetime
from uuid import uuid4
from typing import Optional
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, Text, JSON, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from app.db.base import Base


class Response(Base):
    """SQLAlchemy Response model."""

    __tablename__ = "responses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    simulation_id = Column(Uuid(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    respondent_id = Column(Integer, nullable=False)
    question_id = Column(Uuid(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    numeric_answer = Column(Integer, nullable=True)
    text_answer = Column(Text, nullable=True)
    llm_prompt_history = Column(JSON, nullable=True)  # { system, user, response }
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    simulation = relationship("Simulation", back_populates="responses")
    question = relationship("Question", back_populates="responses")


class ResponseRecord(BaseModel):
    respondent_id: int
    question_id: str
    question_text: str
    type: str
    options: Optional[list[str]] = None
    numeric_answer: Optional[int]
    text_answer: Optional[str]
    created_at: datetime


class SimulationDetailResponse(BaseModel):
    id: str
    user_id: str
    persona_id: str
    survey_id: str
    persona_name: str
    survey_title: str
    sample_size: int
    status: str
    total_responses: int
    error_message: Optional[str] = None
    responses: list[ResponseRecord]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
