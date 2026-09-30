from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import api_router

app = FastAPI(
    title="Wafer Defect Classification API",
    version="1.0.0",
    description="REST API backend for Wafer Defect Classification & ML inference",
)

# Configure CORS middleware
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Wafer Defect Classification API",
        "docs": "/docs",
        "health": "/api/health",
        "database_health": "/api/health/database",
    }
