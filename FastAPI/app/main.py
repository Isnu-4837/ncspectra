from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import SessionLocal, init_db
from app.utils.seed import seed_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB tables and seed data exactly once at startup."""
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    yield  # application runs here


app = FastAPI(
    title="NCSpectra Tactical Field Backend",
    version=settings.APP_VERSION,
    description="Field reagent, analysis, record, and sync API for NCSpectra.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "NCSpectra backend is running",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
