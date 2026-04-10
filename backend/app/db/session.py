from functools import lru_cache
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from fastapi import HTTPException, status
from app.config import get_settings
from app.db.base import Base

settings = get_settings()

PERSONA_COLUMN_DEFAULTS = {
    "social_influence": 0.5,
    "routine_preference": 0.5,
    "convenience_focus": 0.5,
    "quality_orientation": 0.5,
}


def _normalize_database_url(database_url: str) -> str:
    """Map generic Postgres URLs to the installed psycopg v3 driver."""
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def _engine_kwargs(database_url: str) -> dict:
    """Return engine kwargs for the active database backend."""
    normalized_url = _normalize_database_url(database_url)
    kwargs = {
        "pool_pre_ping": True,
        "echo": settings.environment == "development",
    }
    if normalized_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    return kwargs


# Create database engine
engine = create_engine(
    _normalize_database_url(settings.database_url),
    **_engine_kwargs(settings.database_url),
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def _load_models() -> None:
    """Import model modules so SQLAlchemy metadata is populated."""
    from app.models.user import User  # noqa: F401
    from app.models.persona import Persona  # noqa: F401
    from app.models.survey import Survey  # noqa: F401
    from app.models.question import Question  # noqa: F401
    from app.models.simulation import Simulation  # noqa: F401
    from app.models.response import Response  # noqa: F401


def _ensure_persona_columns() -> None:
    """Add newly introduced persona columns for existing databases."""
    inspector = inspect(engine)
    try:
        existing_columns = {column["name"] for column in inspector.get_columns("personas")}
    except Exception:
        return

    with engine.begin() as connection:
        for column_name, default_value in PERSONA_COLUMN_DEFAULTS.items():
            if column_name in existing_columns:
                continue

            connection.execute(
                text(
                    f"ALTER TABLE personas ADD COLUMN {column_name} FLOAT NOT NULL DEFAULT {default_value}"
                )
            )


@lru_cache()
def ensure_db_initialized() -> None:
    """Create database tables lazily for serverless environments."""
    _load_models()
    Base.metadata.create_all(bind=engine)
    _ensure_persona_columns()


def get_db() -> Session:
    """Dependency for FastAPI routes to get database session."""
    try:
        ensure_db_initialized()
        db = SessionLocal()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured or is temporarily unavailable.",
        ) from exc
    try:
        yield db
    finally:
        db.close()
