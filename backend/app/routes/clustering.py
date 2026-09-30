from flask import Blueprint, jsonify, request
from ..services.clustering_service import clustering_service

router = Blueprint("clustering", __name__, url_prefix="/api/clustering")


@router.route("/predict", methods=["POST"])
def predict_cluster():
    """
    Executes unsupervised clustering assignment on provided wafer features.
    Accepts JSON body: { "features": { ... } } or direct feature key-value pairs.
    """
    data = request.get_json(silent=True) or {}
    features = data.get("features", data)
    result = clustering_service.predict(features)
    return jsonify(result), 200


@router.route("/profiles", methods=["GET"])
def get_profiles():
    """
    Returns full statistical profiles for all 5 detected wafer clusters.
    """
    profiles = clustering_service.get_all_profiles()
    return jsonify({
        "status": "success",
        "clusters_count": len(profiles),
        "profiles": profiles
    }), 200
