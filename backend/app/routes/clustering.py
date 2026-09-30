import logging
from flask import Blueprint, jsonify, request
from ..services.clustering_service import clustering_service

logger = logging.getLogger(__name__)

router = Blueprint("clustering", __name__, url_prefix="/api/clustering")


@router.route("/predict", methods=["POST"])
def predict_cluster():
    """
    Executes unsupervised clustering assignment on provided wafer features.
    Accepts JSON body: { "features": { ... } } or direct feature key-value pairs.
    Returns HTTP 400 for validation errors, HTTP 500 for database / internal errors.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON payload in request body."
        }), 400

    features = data.get("features", data)
    try:
        result = clustering_service.predict(features)
        if result.get("status") == "error":
            return jsonify(result), 500
        return jsonify(result), 200
    except ValueError as ve:
        logger.warning(f"Clustering validation error: {ve}")
        return jsonify({
            "status": "error",
            "error_type": "validation_error",
            "message": str(ve)
        }), 400
    except RuntimeError as re:
        logger.error(f"Clustering system/database error: {re}")
        return jsonify({
            "status": "error",
            "error_type": "persistence_error",
            "message": str(re)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected clustering error: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "error_type": "server_error",
            "message": "Internal clustering execution failure."
        }), 500


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


@router.route("/metrics", methods=["GET"])
def get_metrics():
    """
    Returns clustering quality metrics (Silhouette, Davies-Bouldin, Calinski-Harabasz).
    """
    metrics = clustering_service.get_metrics()
    return jsonify(metrics), 200


@router.route("/history", methods=["GET"])
def get_history():
    """
    Returns recent clustering runs recorded in PostgreSQL.
    """
    limit = int(request.args.get("limit", 10))
    history = clustering_service.get_history(limit=limit)
    return jsonify({
        "status": "success",
        "count": len(history),
        "history": history
    }), 200
