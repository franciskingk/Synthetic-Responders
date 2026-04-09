from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.persona import Persona, PersonaDemographicsSchema, PersonaPsychographicsSchema


class PersonaService:
    """Service for persona operations."""
    
    VALID_INCOME_BANDS = ["$0-30K", "$30-60K", "$60-100K", "$100K+"]
    VALID_EDUCATION_LEVELS = ["HS", "BA", "MA", "PhD"]
    VALID_GENDERS = ["M", "F", "Other"]
    
    @staticmethod
    def validate_demographics(demographics: PersonaDemographicsSchema) -> None:
        """Validate demographics values."""
        if demographics.income_band not in PersonaService.VALID_INCOME_BANDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid income_band. Must be one of: {PersonaService.VALID_INCOME_BANDS}",
            )
        
        if demographics.education_level not in PersonaService.VALID_EDUCATION_LEVELS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid education_level. Must be one of: {PersonaService.VALID_EDUCATION_LEVELS}",
            )
    
    @staticmethod
    def create_persona(
        user_id: UUID,
        demographics: PersonaDemographicsSchema,
        psychographics: PersonaPsychographicsSchema,
        db: Session,
    ) -> Persona:
        """Create a new persona."""
        PersonaService.validate_demographics(demographics)
        
        new_persona = Persona(
            user_id=user_id,
            name=demographics.name,
            age=demographics.age,
            gender=demographics.gender,
            location=demographics.location,
            income_band=demographics.income_band,
            education_level=demographics.education_level,
            risk_tolerance=max(0.0, min(1.0, psychographics.risk_tolerance)),
            brand_loyalty=max(0.0, min(1.0, psychographics.brand_loyalty)),
            price_sensitivity=max(0.0, min(1.0, psychographics.price_sensitivity)),
            innovation_openness=max(0.0, min(1.0, psychographics.innovation_openness)),
            trust_in_institutions=max(0.0, min(1.0, psychographics.trust_in_institutions)),
        )
        db.add(new_persona)
        db.commit()
        db.refresh(new_persona)
        return new_persona
    
    @staticmethod
    def get_persona(persona_id: UUID, db: Session) -> Optional[Persona]:
        """Get a persona by ID."""
        return db.query(Persona).filter(Persona.id == persona_id).first()
    
    @staticmethod
    def list_personas(user_id: UUID, db: Session) -> list[Persona]:
        """List all personas for a user."""
        return db.query(Persona).filter(Persona.user_id == user_id).all()
    
    @staticmethod
    def update_persona(
        persona_id: UUID,
        user_id: UUID,
        demographics: Optional[PersonaDemographicsSchema],
        psychographics: Optional[PersonaPsychographicsSchema],
        db: Session,
    ) -> Persona:
        """Update a persona."""
        persona = db.query(Persona).filter(
            Persona.id == persona_id,
            Persona.user_id == user_id,
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found",
            )
        
        if demographics:
            PersonaService.validate_demographics(demographics)
            persona.name = demographics.name
            persona.age = demographics.age
            persona.gender = demographics.gender
            persona.location = demographics.location
            persona.income_band = demographics.income_band
            persona.education_level = demographics.education_level
        
        if psychographics:
            persona.risk_tolerance = max(0.0, min(1.0, psychographics.risk_tolerance))
            persona.brand_loyalty = max(0.0, min(1.0, psychographics.brand_loyalty))
            persona.price_sensitivity = max(0.0, min(1.0, psychographics.price_sensitivity))
            persona.innovation_openness = max(0.0, min(1.0, psychographics.innovation_openness))
            persona.trust_in_institutions = max(0.0, min(1.0, psychographics.trust_in_institutions))
        
        db.add(persona)
        db.commit()
        db.refresh(persona)
        return persona
    
    @staticmethod
    def delete_persona(persona_id: UUID, user_id: UUID, db: Session) -> bool:
        """Delete a persona."""
        persona = db.query(Persona).filter(
            Persona.id == persona_id,
            Persona.user_id == user_id,
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona not found",
            )
        
        db.delete(persona)
        db.commit()
        return True
