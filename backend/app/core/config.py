import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Wafer Defect ML API"
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://wafer_user:wafer_password@postgres:5432/wafer_db"

    # CORS Allowed Origins
    ALLOWED_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://localhost"

    # Model storage directory
    MODELS_DIR: str = "app/models"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
