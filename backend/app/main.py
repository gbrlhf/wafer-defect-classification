import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .routes.health import router as health_router
from .routes.dataset import router as dataset_router
from .routes.model import router as model_router
from .routes.classification import router as classification_router
from .routes.clustering import router as clustering_router

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Optional table creation on startup if database is reachable
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully.")
        except Exception as e:
            logger.warning(f"Database initialization deferred (database may still be starting): {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-ready FastAPI backend for semiconductor wafer defect analysis. "
        "Provides endpoints for health checks, dataset inspection, model metrics, "
        "supervised defect classification, unsupervised wafer clustering, and PostgreSQL persistence."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS Middleware from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
        "message": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "health": "/api/health"
    }
