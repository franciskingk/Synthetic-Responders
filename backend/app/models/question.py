from datetime import datetime
from uuid import uuid4
from typing import Optional, List
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, Text, JSON, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, field_validator
from app.db.base import Base


class Question(Base):
    """SQLAlchemy Question model."""
    __tablename__ = "questions"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    survey_id = Column(Uuid(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # "mcq", "likert", "open"
    options = Column(JSON, nullable=True)  # For MCQ
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    survey = relationship("Survey", back_populates="questions")
    responses = relationship("Response", back_populates="question", cascade="all, delete-orphan")


# Pydantic schemas
class QuestionCreateRequest(BaseModel):
    question_text: str = Field(min_length=5, max_length=2000)
    type: str = Field(pattern="^(mcq|likert|open)$")
    options: Optional[List[str]] = None
    order_index: int = Field(ge=0)
    
    @field_validator("options")
    @classmethod
    def validate_options(cls, v, info):
        """Validate MCQ options."""
        question_type = info.data.get("type")
        if question_type == "mcq":
            if not v or len(v) < 2:
                raise ValueError("MCQ must have at least 2 options")
        return v


class QuestionResponse(BaseModel):
    id: str
    survey_id: str
    question_text: str
    type: str
    options: Optional[List[str]]
    order_index: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionReorderRequest(BaseModel):
    order_map: dict  # { question_id: new_order_index }
