"""Settings loaded from env (Pydantic v2 + pydantic-settings)."""
from typing import List
from pydantic import Field, field_validator
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

    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    PORT: int = 4000
    ENV: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL_ASYNC:
            return self.DATABASE_URL_ASYNC
        # postgresql:// → postgresql+asyncpg://
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


settings = Settings()  # type: ignore[call-arg]
