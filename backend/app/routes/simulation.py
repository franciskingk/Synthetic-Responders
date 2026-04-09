from uuid import UUID
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.middleware.auth_middleware import get_current_user_id
from app.services.simulation_service import SimulationService
from app.services.export_service import ExportService
from app.models.simulation import SimulationCreateRequest, SimulationResponse, SimulationListResponse
from app.models.response import SimulationDetailResponse

router = APIRouter(prefix="/simulations", tags=["Simulations"])


def build_simulation_response(simulation) -> SimulationResponse:
    """Map a simulation ORM object into the shared response payload."""
    return SimulationResponse(
        id=str(simulation.id),
        user_id=str(simulation.user_id),
        persona_id=str(simulation.persona_id),
        survey_id=str(simulation.survey_id),
        persona_name=simulation.persona.name if simulation.persona else None,
        survey_title=simulation.survey.title if simulation.survey else None,
        sample_size=simulation.sample_size,
        status=simulation.status,
        total_responses=simulation.total_responses,
        error_message=simulation.error_message,
        created_at=simulation.created_at,
        updated_at=simulation.updated_at,
    )


@router.post("", response_model=SimulationResponse)
async def create_and_run_simulation(
    request: SimulationCreateRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a simulation and run it in the background."""
    user_uuid = UUID(user_id)
    simulation = SimulationService.create_simulation(
        user_uuid,
        UUID(request.persona_id),
        UUID(request.survey_id),
        request.sample_size,
        db,
    )

    background_tasks.add_task(
        SimulationService.run_simulation,
        simulation.id,
        user_uuid,
    )

    return build_simulation_response(simulation)


@router.get("", response_model=SimulationListResponse)
def list_simulations(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all simulations for the current user."""
    user_uuid = UUID(user_id)
    simulations = SimulationService.list_simulations(user_uuid, db)

    sim_responses = [build_simulation_response(simulation) for simulation in simulations]

    return SimulationListResponse(simulations=sim_responses, count=len(sim_responses))


@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(
    simulation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get simulation details and status."""
    simulation_uuid = UUID(simulation_id)
    user_uuid = UUID(user_id)
    simulation = SimulationService.get_simulation(simulation_uuid, user_uuid, db)

    return build_simulation_response(simulation)


@router.get("/{simulation_id}/results", response_model=SimulationDetailResponse)
def get_simulation_results(
    simulation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get simulation results for detail views and analytics."""
    simulation_uuid = UUID(simulation_id)
    user_uuid = UUID(user_id)
    return SimulationService.get_simulation_results(simulation_uuid, user_uuid, db)


@router.get("/{simulation_id}/export")
def export_simulation(
    simulation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Export simulation responses as CSV."""
    simulation_uuid = UUID(simulation_id)
    user_uuid = UUID(user_id)

    csv_bytes = ExportService.export_simulation_csv(simulation_uuid, user_uuid, db)
    filename = ExportService.get_csv_filename(simulation_uuid)

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
