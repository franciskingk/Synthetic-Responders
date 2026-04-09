from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.survey import Survey
from app.models.question import Question


class SurveyService:
    """Service for survey operations."""
    
    @staticmethod
    def create_survey(user_id: UUID, title: str, db: Session) -> Survey:
        """Create a new survey."""
        new_survey = Survey(
            user_id=user_id,
            title=title,
        )
        db.add(new_survey)
        db.commit()
        db.refresh(new_survey)
        return new_survey
    
    @staticmethod
    def get_survey(survey_id: UUID, db: Session) -> Optional[Survey]:
        """Get survey by ID with all questions."""
        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if survey:
            # Load questions ordered by order_index
            survey.questions = sorted(survey.questions, key=lambda q: q.order_index)
        return survey
    
    @staticmethod
    def list_surveys(user_id: UUID, db: Session) -> list[Survey]:
        """List all surveys for a user."""
        return db.query(Survey).filter(Survey.user_id == user_id).all()
    
    @staticmethod
    def delete_survey(survey_id: UUID, user_id: UUID, db: Session) -> bool:
        """Delete a survey and all its questions."""
        survey = db.query(Survey).filter(
            Survey.id == survey_id,
            Survey.user_id == user_id,
        ).first()
        
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Survey not found",
            )
        
        db.delete(survey)
        db.commit()
        return True
    
    @staticmethod
    def add_question(
        survey_id: UUID,
        user_id: UUID,
        question_text: str,
        question_type: str,
        options: Optional[list],
        order_index: int,
        db: Session,
    ) -> Question:
        """Add a question to a survey."""
        # Verify survey belongs to user
        survey = db.query(Survey).filter(
            Survey.id == survey_id,
            Survey.user_id == user_id,
        ).first()
        
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Survey not found",
            )
        
        # Validate question type
        if question_type not in ["mcq", "likert", "open"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid question type",
            )
        
        # Validate MCQ options
        if question_type == "mcq":
            if not options or len(options) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="MCQ must have at least 2 options",
                )
        
        new_question = Question(
            survey_id=survey_id,
            question_text=question_text,
            type=question_type,
            options=options,
            order_index=order_index,
        )
        db.add(new_question)
        db.commit()
        db.refresh(new_question)
        return new_question
    
    @staticmethod
    def update_question_order(
        survey_id: UUID,
        user_id: UUID,
        order_map: dict,
        db: Session,
    ) -> list[Question]:
        """Update question order within a survey."""
        # Verify survey belongs to user
        survey = db.query(Survey).filter(
            Survey.id == survey_id,
            Survey.user_id == user_id,
        ).first()
        
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Survey not found",
            )
        
        # Update all questions
        for question_id_str, new_order in order_map.items():
            question_id = UUID(question_id_str)
            question = db.query(Question).filter(
                Question.id == question_id,
                Question.survey_id == survey_id,
            ).first()
            
            if not question:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question {question_id} not found in survey",
                )
            
            question.order_index = new_order
            db.add(question)
        
        db.commit()
        
        # Return updated questions sorted by order
        updated_questions = db.query(Question).filter(
            Question.survey_id == survey_id
        ).all()
        return sorted(updated_questions, key=lambda q: q.order_index)
    
    @staticmethod
    def delete_question(
        question_id: UUID,
        survey_id: UUID,
        user_id: UUID,
        db: Session,
    ) -> bool:
        """Delete a question from a survey."""
        # Verify survey belongs to user
        survey = db.query(Survey).filter(
            Survey.id == survey_id,
            Survey.user_id == user_id,
        ).first()
        
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Survey not found",
            )
        
        question = db.query(Question).filter(
            Question.id == question_id,
            Question.survey_id == survey_id,
        ).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found",
            )
        
        db.delete(question)
        db.commit()
        return True
