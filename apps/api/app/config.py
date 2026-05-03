"""Settings loaded from env (Pydantic v2 + pydantic-settings)."""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = Field(..., description="Sync Postgres URL (psycopg2). Used by Alembic + seed.")
    DATABASE_URL_ASYNC: str = Field(
        default="",
        description="Async Postgres URL (asyncpg). If empty, derived from DATABASE_URL.",
    )

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7  # 7 days

    # Plain str so env / .env comma-separated values are not JSON-decoded by pydantic-settings.
    cors_origins: str = Field(
        default="http://localhost:5173",
        validation_alias="CORS_ORIGINS",
        description="Comma-separated browser origins for CORS.",
    )

    PORT: int = 4000
    ENV: str = "development"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL_ASYNC:
            return self.DATABASE_URL_ASYNC
        # postgresql:// → postgresql+asyncpg://
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


settings = Settings()  # type: ignore[call-arg]
