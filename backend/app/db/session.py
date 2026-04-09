from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import get_settings

settings = get_settings()


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


def get_db() -> Session:
    """Dependency for FastAPI routes to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
