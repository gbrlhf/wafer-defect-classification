from flask import Blueprint, jsonify, request
from ..services.clustering_service import clustering_service

router = Blueprint("clustering", __name__, url_prefix="/api/clustering")


@router.route("/predict", methods=["POST"])
def predict_cluster():
    """
    Executes unsupervised clustering assignment on provided wafer features.
    If model has not yet been exported from Google Colab, returns instructions.
    """
    data = request.get_json(silent=True) or {}
    features = data.get("features", {})
    result = clustering_service.predict(features)
    return jsonify({
        "status": result.get("status", "pending_model"),
        "cluster_id": result.get("cluster_id"),
        "cluster_name": result.get("cluster_name"),
        "message": result.get("message"),
    }), 200
