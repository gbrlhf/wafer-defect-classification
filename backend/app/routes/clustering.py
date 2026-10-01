import logging
from flask import Blueprint, jsonify, request
from ..services.clustering_service import clustering_service

logger = logging.getLogger(__name__)

router = Blueprint("clustering", __name__, url_prefix="/api/clustering")


@router.route("/predict", methods=["POST"])
def predict_cluster():
    """
    Executes unsupervised clustering assignment on selected process step.
    Accepts JSON body: { "process_step": "Oxidation" } or { "features": { "process_step": "..." } }.
    Returns HTTP 200 with cluster result, HTTP 400 for validation errors, HTTP 500 for server errors.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "success": False,
            "status": "error",
            "error_type": "invalid_json",
            "message": "Invalid JSON payload in request body."
        }), 400

    try:
        result = clustering_service.predict(data)
        if result.get("status") == "error":
            return jsonify(result), 500
        return jsonify(result), 200
    except ValueError as ve:
        logger.warning(f"Clustering validation error: {ve}")
        return jsonify({
            "success": False,
            "status": "error",
            "error_type": "validation_error",
            "message": str(ve)
        }), 400
    except RuntimeError as re:
        logger.error(f"Clustering database/runtime error: {re}")
        return jsonify({
            "success": False,
            "status": "error",
            "error_type": "persistence_error",
            "message": str(re)
        }), 500
    except Exception as e:
        logger.error(f"Unexpected clustering error: {e}", exc_info=True)
        return jsonify({
            "success": False,
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
