from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.middleware.auth_middleware import get_current_user_id
from app.services.survey_service import SurveyService
from app.models.survey import SurveyCreateRequest, SurveyResponse, SurveyListResponse, SurveyDetailResponse
from app.models.question import QuestionCreateRequest, QuestionResponse, QuestionReorderRequest

router = APIRouter(prefix="/surveys", tags=["Surveys"])


@router.post("", response_model=SurveyResponse)
def create_survey(
    request: SurveyCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new survey."""
    user_uuid = UUID(user_id)
    survey = SurveyService.create_survey(user_uuid, request.title, db)
    
    return SurveyResponse(
        id=str(survey.id),
        user_id=str(survey.user_id),
        title=survey.title,
        question_count=0,
        created_at=survey.created_at,
        updated_at=survey.updated_at,
    )


@router.get("", response_model=SurveyListResponse)
def list_surveys(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all surveys for the current user."""
    user_uuid = UUID(user_id)
    surveys = SurveyService.list_surveys(user_uuid, db)
    
    survey_responses = [
        SurveyResponse(
            id=str(s.id),
            user_id=str(s.user_id),
            title=s.title,
            question_count=s.question_count,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in surveys
    ]
    
    return SurveyListResponse(surveys=survey_responses, count=len(survey_responses))


@router.get("/{survey_id}", response_model=SurveyDetailResponse)
def get_survey(
    survey_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a survey with all questions."""
    survey_uuid = UUID(survey_id)
    user_uuid = UUID(user_id)
    
    survey = SurveyService.get_survey(survey_uuid, db)
    if not survey or survey.user_id != user_uuid:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    question_responses = [
        QuestionResponse(
            id=str(q.id),
            survey_id=str(q.survey_id),
            question_text=q.question_text,
            type=q.type,
            options=q.options,
            order_index=q.order_index,
            created_at=q.created_at,
        )
        for q in survey.questions
    ]
    
    return SurveyDetailResponse(
        id=str(survey.id),
        user_id=str(survey.user_id),
        title=survey.title,
        question_count=survey.question_count,
        questions=question_responses,
        created_at=survey.created_at,
        updated_at=survey.updated_at,
    )


@router.delete("/{survey_id}")
def delete_survey(
    survey_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a survey and all its questions."""
    survey_uuid = UUID(survey_id)
    user_uuid = UUID(user_id)
    
    SurveyService.delete_survey(survey_uuid, user_uuid, db)
    return {"message": "Survey deleted successfully"}


# Questions endpoints
@router.post("/{survey_id}/questions", response_model=QuestionResponse)
def add_question(
    survey_id: str,
    request: QuestionCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a question to a survey."""
    survey_uuid = UUID(survey_id)
    user_uuid = UUID(user_id)
    
    question = SurveyService.add_question(
        survey_uuid,
        user_uuid,
        request.question_text,
        request.type,
        request.options,
        request.order_index,
        db,
    )
    
    return QuestionResponse(
        id=str(question.id),
        survey_id=str(question.survey_id),
        question_text=question.question_text,
        type=question.type,
        options=question.options,
        order_index=question.order_index,
        created_at=question.created_at,
    )


@router.put("/{survey_id}/reorder-questions")
def reorder_questions(
    survey_id: str,
    request: QuestionReorderRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Reorder questions within a survey."""
    survey_uuid = UUID(survey_id)
    user_uuid = UUID(user_id)
    
    questions = SurveyService.update_question_order(
        survey_uuid,
        user_uuid,
        request.order_map,
        db,
    )
    
    question_responses = [
        QuestionResponse(
            id=str(q.id),
            survey_id=str(q.survey_id),
            question_text=q.question_text,
            type=q.type,
            options=q.options,
            order_index=q.order_index,
            created_at=q.created_at,
        )
        for q in questions
    ]
    
    return {"questions": question_responses}


@router.delete("/{survey_id}/questions/{question_id}")
def delete_question(
    survey_id: str,
    question_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a question from a survey."""
    survey_uuid = UUID(survey_id)
    question_uuid = UUID(question_id)
    user_uuid = UUID(user_id)
    
    SurveyService.delete_question(question_uuid, survey_uuid, user_uuid, db)
    return {"message": "Question deleted successfully"}
