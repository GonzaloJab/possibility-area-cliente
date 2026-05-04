"""Settings loaded from env (Pydantic v2 + pydantic-settings)."""
import json
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

    # Comma-separated. Do not use List[str] here: pydantic-settings JSON-decodes env values first,
    # which breaks comma lists and empty strings.
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173",
        description="Comma-separated browser origins (e.g. http://localhost:5173,http://127.0.0.1:5174).",
    )

    PORT: int = 4000
    ENV: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _normalize_cors_origins(cls, v):
        if v is None:
            return "http://localhost:5173"
        if isinstance(v, list):
            return ",".join(str(x).strip() for x in v if str(x).strip())
        s = str(v).strip()
        if not s:
            return "http://localhost:5173"
        if s.startswith("["):
            try:
                parsed = json.loads(s)
                if isinstance(parsed, list):
                    joined = ",".join(str(x).strip() for x in parsed if str(x).strip())
                    return joined or "http://localhost:5173"
            except json.JSONDecodeError:
                pass
        return s

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL_ASYNC:
            return self.DATABASE_URL_ASYNC
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


settings = Settings()  # type: ignore[call-arg]
