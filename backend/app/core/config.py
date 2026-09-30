from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    No hardcoded credentials.
    """

    APP_ENV: str = "development"
    APP_NAME: str = "Wafer Defect Classification API"
    API_PORT: int = 8001
    DATABASE_URL: str = "postgresql://wafer_user:wafer_password@postgres:5432/wafer_db"
    ALLOWED_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"
    MODELS_DIR: str = "app/models"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return []
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
