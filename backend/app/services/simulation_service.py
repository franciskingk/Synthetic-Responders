from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.simulation import Simulation
from app.models.response import Response, SimulationDetailResponse, ResponseRecord
from app.services.persona_service import PersonaService
from app.services.survey_service import SurveyService
from app.engine.quant_engine import QuantEngine
from app.engine.qual_engine import QualEngine
from app.config import get_settings
from app.db.session import SessionLocal

settings = get_settings()


class SimulationService:
    """Service for running simulations and generating synthetic responses."""

    @staticmethod
    def create_simulation(
        user_id: UUID,
        persona_id: UUID,
        survey_id: UUID,
        sample_size: int,
        db: Session,
    ) -> Simulation:
        """Create a simulation record."""
        if sample_size < 1 or sample_size > settings.max_sample_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample size must be between 1 and {settings.max_sample_size}",
            )

        persona = PersonaService.get_persona(persona_id, db)
        if not persona or persona.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found",
            )

        survey = SurveyService.get_survey(survey_id, db)
        if not survey or survey.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Survey not found",
            )

        if not survey.questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Survey must have at least one question",
            )

        new_simulation = Simulation(
            user_id=user_id,
            persona_id=persona_id,
            survey_id=survey_id,
            sample_size=sample_size,
            status="running",
        )
        db.add(new_simulation)
        db.commit()
        db.refresh(new_simulation)
        return new_simulation

    @staticmethod
    async def run_simulation(
        simulation_id: UUID,
        user_id: UUID,
    ) -> Simulation | None:
        """Run a simulation and persist all generated responses."""
        db = SessionLocal()
        simulation = None
        try:
            simulation = db.query(Simulation).filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user_id,
            ).first()

            if not simulation:
                return None

            persona = PersonaService.get_persona(simulation.persona_id, db)
            survey = SurveyService.get_survey(simulation.survey_id, db)

            if not persona or not survey:
                simulation.status = "failed"
                simulation.error_message = "Persona or survey not found"
                db.add(simulation)
                db.commit()
                return simulation

            questions = sorted(survey.questions, key=lambda q: q.order_index)

            for respondent_id in range(1, simulation.sample_size + 1):
                for question in questions:
                    if question.type == "mcq":
                        selected_index = QuantEngine.simulate_mcq_response(
                            persona,
                            question.options,
                            seed=respondent_id,
                        )
                        response = Response(
                            simulation_id=simulation_id,
                            respondent_id=respondent_id,
                            question_id=question.id,
                            numeric_answer=selected_index,
                            text_answer=None,
                            llm_prompt_history=None,
                        )
                    elif question.type == "likert":
                        score = QuantEngine.simulate_likert_response(
                            persona,
                            seed=respondent_id,
                        )
                        response = Response(
                            simulation_id=simulation_id,
                            respondent_id=respondent_id,
                            question_id=question.id,
                            numeric_answer=score,
                            text_answer=None,
                            llm_prompt_history=None,
                        )
                    else:
                        try:
                            text_response, prompt_history = await QualEngine.generate_open_response(
                                persona,
                                question,
                                seed=respondent_id,
                            )
                            response = Response(
                                simulation_id=simulation_id,
                                respondent_id=respondent_id,
                                question_id=question.id,
                                numeric_answer=None,
                                text_answer=text_response,
                                llm_prompt_history=prompt_history,
                            )
                        except Exception as exc:
                            response = Response(
                                simulation_id=simulation_id,
                                respondent_id=respondent_id,
                                question_id=question.id,
                                numeric_answer=None,
                                text_answer=f"[Error generating response: {str(exc)}]",
                                llm_prompt_history=None,
                            )

                    db.add(response)

            db.commit()

            simulation.status = "complete"
            simulation.error_message = None
            db.add(simulation)
            db.commit()
            db.refresh(simulation)
            return simulation

        except Exception as exc:
            db.rollback()
            if simulation:
                simulation.status = "failed"
                simulation.error_message = str(exc)
                db.add(simulation)
                db.commit()
            return None
        finally:
            db.close()

    @staticmethod
    def get_simulation(simulation_id: UUID, user_id: UUID, db: Session) -> Simulation:
        """Get a simulation summary by ID."""
        simulation = (
            db.query(Simulation)
            .options(
                joinedload(Simulation.persona),
                joinedload(Simulation.survey),
                joinedload(Simulation.responses),
            )
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user_id,
            )
            .first()
        )

        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        return simulation

    @staticmethod
    def get_simulation_results(
        simulation_id: UUID,
        user_id: UUID,
        db: Session,
    ) -> SimulationDetailResponse:
        """Get a simulation with all response records for result views."""
        simulation = (
            db.query(Simulation)
            .options(
                joinedload(Simulation.persona),
                joinedload(Simulation.survey),
                joinedload(Simulation.responses).joinedload(Response.question),
            )
            .filter(
                Simulation.id == simulation_id,
                Simulation.user_id == user_id,
            )
            .first()
        )

        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )

        records = [
            ResponseRecord(
                respondent_id=response.respondent_id,
                question_id=str(response.question_id),
                question_text=response.question.question_text if response.question else "",
                type=response.question.type if response.question else "unknown",
                options=response.question.options if response.question else None,
                numeric_answer=response.numeric_answer,
                text_answer=response.text_answer,
                created_at=response.created_at,
            )
            for response in sorted(
                simulation.responses,
                key=lambda item: (item.respondent_id, item.question.order_index if item.question else 0),
            )
        ]

        return SimulationDetailResponse(
            id=str(simulation.id),
            user_id=str(simulation.user_id),
            persona_id=str(simulation.persona_id),
            survey_id=str(simulation.survey_id),
            persona_name=simulation.persona.name if simulation.persona else "Unknown Persona",
            survey_title=simulation.survey.title if simulation.survey else "Unknown Survey",
            sample_size=simulation.sample_size,
            status=simulation.status,
            total_responses=simulation.total_responses,
            error_message=simulation.error_message,
            responses=records,
            created_at=simulation.created_at,
            updated_at=simulation.updated_at,
        )

    @staticmethod
    def list_simulations(user_id: UUID, db: Session) -> list[Simulation]:
        """List all simulations for a user."""
        return (
            db.query(Simulation)
            .options(
                joinedload(Simulation.persona),
                joinedload(Simulation.survey),
                joinedload(Simulation.responses),
            )
            .filter(Simulation.user_id == user_id)
            .order_by(Simulation.created_at.desc())
            .all()
        )
