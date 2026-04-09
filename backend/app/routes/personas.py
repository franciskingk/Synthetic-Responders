from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.middleware.auth_middleware import get_current_user_id
from app.services.persona_service import PersonaService
from app.models.persona import (
    PersonaCreateRequest,
    PersonaUpdateRequest,
    PersonaResponse,
    PersonaListResponse,
)

router = APIRouter(prefix="/personas", tags=["Personas"])


@router.post("", response_model=PersonaResponse)
def create_persona(
    request: PersonaCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new persona."""
    user_uuid = UUID(user_id)
    persona = PersonaService.create_persona(
        user_uuid,
        request.demographics,
        request.psychographics,
        db,
    )
    
    return PersonaResponse(
        id=str(persona.id),
        user_id=str(persona.user_id),
        demographics=request.demographics,
        psychographics=request.psychographics,
        created_at=persona.created_at,
        updated_at=persona.updated_at,
    )


@router.get("", response_model=PersonaListResponse)
def list_personas(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all personas for the current user."""
    user_uuid = UUID(user_id)
    personas = PersonaService.list_personas(user_uuid, db)
    
    persona_responses = []
    for persona in personas:
        demo = {
            "name": persona.name,
            "age": persona.age,
            "gender": persona.gender,
            "location": persona.location,
            "income_band": persona.income_band,
            "education_level": persona.education_level,
        }
        psych = {
            "risk_tolerance": persona.risk_tolerance,
            "brand_loyalty": persona.brand_loyalty,
            "price_sensitivity": persona.price_sensitivity,
            "innovation_openness": persona.innovation_openness,
            "trust_in_institutions": persona.trust_in_institutions,
        }
        persona_responses.append(
            PersonaResponse(
                id=str(persona.id),
                user_id=str(persona.user_id),
                demographics=demo,
                psychographics=psych,
                created_at=persona.created_at,
                updated_at=persona.updated_at,
            )
        )
    
    return PersonaListResponse(personas=persona_responses, count=len(persona_responses))


@router.get("/{persona_id}", response_model=PersonaResponse)
def get_persona(
    persona_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific persona."""
    persona_uuid = UUID(persona_id)
    user_uuid = UUID(user_id)
    
    persona = PersonaService.get_persona(persona_uuid, db)
    if not persona or persona.user_id != user_uuid:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    demo = {
        "name": persona.name,
        "age": persona.age,
        "gender": persona.gender,
        "location": persona.location,
        "income_band": persona.income_band,
        "education_level": persona.education_level,
    }
    psych = {
        "risk_tolerance": persona.risk_tolerance,
        "brand_loyalty": persona.brand_loyalty,
        "price_sensitivity": persona.price_sensitivity,
        "innovation_openness": persona.innovation_openness,
        "trust_in_institutions": persona.trust_in_institutions,
    }
    
    return PersonaResponse(
        id=str(persona.id),
        user_id=str(persona.user_id),
        demographics=demo,
        psychographics=psych,
        created_at=persona.created_at,
        updated_at=persona.updated_at,
    )


@router.put("/{persona_id}", response_model=PersonaResponse)
def update_persona(
    persona_id: str,
    request: PersonaUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a persona."""
    persona_uuid = UUID(persona_id)
    user_uuid = UUID(user_id)
    
    persona = PersonaService.update_persona(
        persona_uuid,
        user_uuid,
        request.demographics,
        request.psychographics,
        db,
    )
    
    demo = {
        "name": persona.name,
        "age": persona.age,
        "gender": persona.gender,
        "location": persona.location,
        "income_band": persona.income_band,
        "education_level": persona.education_level,
    }
    psych = {
        "risk_tolerance": persona.risk_tolerance,
        "brand_loyalty": persona.brand_loyalty,
        "price_sensitivity": persona.price_sensitivity,
        "innovation_openness": persona.innovation_openness,
        "trust_in_institutions": persona.trust_in_institutions,
    }
    
    return PersonaResponse(
        id=str(persona.id),
        user_id=str(persona.user_id),
        demographics=demo,
        psychographics=psych,
        created_at=persona.created_at,
        updated_at=persona.updated_at,
    )


@router.delete("/{persona_id}")
def delete_persona(
    persona_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a persona."""
    persona_uuid = UUID(persona_id)
    user_uuid = UUID(user_id)
    
    PersonaService.delete_persona(persona_uuid, user_uuid, db)
    return {"message": "Persona deleted successfully"}
