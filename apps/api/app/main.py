"""FastAPI entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, supplies

app = FastAPI(
    title="Possibility® Área Cliente API",
    version="0.1.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
async def root() -> dict:
    """Bare GET / avoids 404 when opening the API base URL in a browser."""
    return {
        "service": "Possibility Área Cliente API",
        "health": "/health",
        **({"docs": "/docs"} if settings.ENV != "production" else {}),
    }


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"ok": True, "env": settings.ENV}


app.include_router(auth.router)
app.include_router(supplies.router)
