from flask import Blueprint, jsonify
from ..services.model_service import model_service

router = Blueprint("model", __name__, url_prefix="/api/model")


@router.route("/metrics", methods=["GET"])
def get_model_metrics():
    """
    Returns evaluation metrics and operational readiness for ML models.
    """
    status_info = model_service.get_models_status()
    return jsonify({
        "status": "pending_training" if not status_info["ready_for_inference"] else "active",
        "artifacts_status": status_info,
        "classification_metrics": {
            "model_type": "Supervised Classifier",
            "status": "Ready" if status_info["classifier_available"] else "Pending Google Colab training",
            "accuracy": None,
            "f1_score": None,
            "precision": None,
            "recall": None,
        },
        "clustering_metrics": {
            "model_type": "Unsupervised Clustering",
            "status": "Ready" if status_info["clustering_available"] else "Pending Google Colab training",
            "silhouette_score": None,
            "n_clusters": None,
        },
    }), 200
