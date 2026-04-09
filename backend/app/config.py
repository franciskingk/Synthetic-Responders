from pathlib import Path
from functools import lru_cache
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/synthetic_research_lab"
    
    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 168  # 7 days
    
    # LLM Providers
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    local_llm_endpoint: str = ""
    
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/auth/callback"
    
    # Environment
    environment: str = "development"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    
    # Simulation
    max_sample_size: int = 300
    llm_timeout_seconds: int = 30
    llm_max_retries: int = 3

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        """Allow comma-separated origins in the env file."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        return ["http://localhost:3000", "http://localhost:3001"]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
