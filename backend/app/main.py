import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes.dataset import router as dataset_router
from .routes.model import router as model_router
from .routes.classification import router as classification_router
from .routes.clustering import router as clustering_router

app = FastAPI(
    title="Wafer Defect Classification & Clustering API",
    description=(
        "Production-ready FastAPI backend for semiconductor wafer defect analysis. "
        "Provides endpoints for health checks, dataset inspection, model metrics, "
        "supervised defect classification, and unsupervised wafer clustering."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000"
)
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(dataset_router)
app.include_router(model_router)
app.include_router(classification_router)
app.include_router(clustering_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Wafer Defect Classification & Clustering API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }
