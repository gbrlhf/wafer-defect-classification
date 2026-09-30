from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    Credentials and environment-dependent configs must not be hardcoded.
    """

    APP_ENV: str = "development"
    API_PORT: int = 8001
    DATABASE_URL: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        """
        Parses comma-separated ALLOWED_ORIGINS string into a list of origins for CORS.
        """
        if not self.ALLOWED_ORIGINS:
            return []
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
