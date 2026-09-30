from fastapi import APIRouter
from typing import Dict, Any
from ..services.model_service import model_service

router = APIRouter(prefix="/api/model", tags=["Model"])

@router.get("/metrics")
def get_model_metrics() -> Dict[str, Any]:
    """
    Returns evaluation metrics and operational readiness for ML models.
    """
    status_info = model_service.get_models_status()
    return {
        "status": "pending_training" if not status_info["ready_for_inference"] else "active",
        "artifacts_status": status_info,
        "classification_metrics": {
            "model_type": "Supervised Classifier",
            "status": "Ready" if status_info["classifier_available"] else "Pending Google Colab training",
            "accuracy": None,
            "f1_score": None,
            "precision": None,
            "recall": None
        },
        "clustering_metrics": {
            "model_type": "Unsupervised Clustering",
            "status": "Ready" if status_info["clustering_available"] else "Pending Google Colab training",
            "silhouette_score": None,
            "n_clusters": None
        }
    }
