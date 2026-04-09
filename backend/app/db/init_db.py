from sqlalchemy import create_engine, text
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


def init_db():
    """Initialize database tables."""
    engine = create_engine(_normalize_database_url(settings.database_url), **_engine_kwargs(settings.database_url))
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")


def drop_db():
    """Drop all tables (for testing/cleanup)."""
    engine = create_engine(_normalize_database_url(settings.database_url), **_engine_kwargs(settings.database_url))
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped")


if __name__ == "__main__":
    init_db()
