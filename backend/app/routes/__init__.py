from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.classification import router as classification_router
from app.routes.clustering import router as clustering_router
from app.routes.predictions import router as predictions_router
from app.routes.model import router as model_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(classification_router)
api_router.include_router(clustering_router)
api_router.include_router(predictions_router)
api_router.include_router(model_router)

__all__ = [
    "api_router",
    "health_router",
    "classification_router",
    "clustering_router",
    "predictions_router",
    "model_router",
]
