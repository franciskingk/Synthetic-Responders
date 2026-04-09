import io
import csv
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.simulation import Simulation
from app.models.response import Response
from app.models.question import Question


class ExportService:
    """Service for exporting simulation data."""
    
    @staticmethod
    def export_simulation_csv(
        simulation_id: UUID,
        user_id: UUID,
        db: Session,
    ) -> bytes:
        """
        Export simulation responses as CSV.
        
        CSV format:
        respondent_id, question_id, question_text, type, numeric_answer, text_answer, created_at
        
        Args:
            simulation_id: ID of simulation to export
            user_id: User ID (for authorization check)
            db: Database session
            
        Returns:
            bytes: CSV file content
        """
        # Get simulation
        simulation = db.query(Simulation).filter(
            Simulation.id == simulation_id,
            Simulation.user_id == user_id,
        ).first()
        
        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found",
            )
        
        # Get all responses with question details
        responses = db.query(Response).filter(
            Response.simulation_id == simulation_id,
        ).all()
        
        # Build CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "respondent_id",
            "question_id",
            "question_text",
            "question_type",
            "numeric_answer",
            "text_answer",
            "created_at",
        ])
        
        # Write data rows
        for response in responses:
            question = db.query(Question).filter(Question.id == response.question_id).first()
            
            if question:
                writer.writerow([
                    response.respondent_id,
                    str(response.question_id),
                    question.question_text,
                    question.type,
                    response.numeric_answer if response.numeric_answer is not None else "",
                    response.text_answer if response.text_answer else "",
                    response.created_at.isoformat() if response.created_at else "",
                ])
        
        # Convert to bytes
        csv_bytes = output.getvalue().encode("utf-8")
        return csv_bytes
    
    @staticmethod
    def get_csv_filename(simulation_id: UUID) -> str:
        """Get recommended filename for CSV export."""
        return f"simulation_{simulation_id}.csv"
