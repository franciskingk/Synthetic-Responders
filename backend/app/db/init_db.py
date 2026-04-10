from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.db.base import Base
from app.db.session import _normalize_database_url, _engine_kwargs
from app.models.user import User
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.question import Question
from app.models.simulation import Simulation
from app.models.response import Response

settings = get_settings()

PERSONA_COLUMN_DEFAULTS = {
    "social_influence": 0.5,
    "routine_preference": 0.5,
    "convenience_focus": 0.5,
    "quality_orientation": 0.5,
}


def _ensure_persona_columns(engine) -> None:
    """Add newly introduced persona columns for existing local databases."""
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("personas")}

    with engine.begin() as connection:
        for column_name, default_value in PERSONA_COLUMN_DEFAULTS.items():
            if column_name in existing_columns:
                continue

            connection.execute(
                text(
                    f"ALTER TABLE personas ADD COLUMN {column_name} FLOAT NOT NULL DEFAULT {default_value}"
                )
            )


def init_db():
    """Initialize database tables."""
    engine = create_engine(_normalize_database_url(settings.database_url), **_engine_kwargs(settings.database_url))
    Base.metadata.create_all(bind=engine)
    _ensure_persona_columns(engine)
    print("Database tables created/verified")


def drop_db():
    """Drop all tables (for testing/cleanup)."""
    engine = create_engine(_normalize_database_url(settings.database_url), **_engine_kwargs(settings.database_url))
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped")


if __name__ == "__main__":
    init_db()
