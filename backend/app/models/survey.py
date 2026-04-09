from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer, Uuid
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from app.db.base import Base


class Survey(Base):
    """SQLAlchemy Survey model."""
    __tablename__ = "surveys"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="surveys")
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="survey", cascade="all, delete-orphan")
    
    @property
    def question_count(self) -> int:
        return len(self.questions) if self.questions else 0


# Pydantic schemas
class SurveyCreateRequest(BaseModel):
    title: str = Field(min_length=5, max_length=512)


class SurveyResponse(BaseModel):
    id: str
    user_id: str
    title: str
    question_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SurveyDetailResponse(BaseModel):
    id: str
    user_id: str
    title: str
    question_count: int
    questions: list = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SurveyListResponse(BaseModel):
    surveys: list[SurveyResponse]
    count: int
