from .health import router as health_router
from .dataset import router as dataset_router
from .model import router as model_router
from .classification import router as classification_router
from .clustering import router as clustering_router

__all__ = [
    "health_router",
    "dataset_router",
    "model_router",
    "classification_router",
    "clustering_router",
]
