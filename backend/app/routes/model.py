from flask import Blueprint, jsonify
from ..services.model_service import model_service

router = Blueprint("model", __name__, url_prefix="/api/model")


@router.route("/status", methods=["GET"])
@router.route("/metrics", methods=["GET"])
def get_model_status_metrics():
    """
    Returns operational readiness and artifact status across Supervised,
    Unsupervised, and Reinforcement Learning models.
    """
    status_info = model_service.get_models_status()
    sup = status_info.get("supervised", {})
    unsup = status_info.get("unsupervised", {})
    rl = status_info.get("reinforcement_learning", {})

    return jsonify({
        "status": "active" if status_info.get("ready_for_inference") else "partial",
        "artifacts_status": status_info,
        "classification_metrics": {
            "model_type": sup.get("name", "Supervised Classifier"),
            "status": "Ready" if sup.get("available") else "Pending Google Colab training",
            "file": sup.get("file"),
            "accuracy": None,
            "f1_score": None,
        },
        "clustering_metrics": {
            "model_type": unsup.get("name", "K-Means Clustering Pipeline"),
            "status": "Ready" if unsup.get("available") else "Pending",
            "file": unsup.get("file"),
            "n_clusters": 5,
            "profiles_available": unsup.get("profiles_available", False)
        },
        "reinforcement_learning_metrics": {
            "model_type": rl.get("name", "Q-Learning Process Controller"),
            "status": "Ready" if rl.get("available") else "Pending",
            "metadata_file": rl.get("metadata_file"),
            "qtable_file": rl.get("qtable_file"),
        }
    }), 200
