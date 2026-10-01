import logging
from flask import Blueprint, jsonify, request
from ..core.database import SessionLocal
from ..models.prediction import PredictionRecord

logger = logging.getLogger(__name__)

router = Blueprint("predictions", __name__, url_prefix="/api/predictions")


@router.route("", methods=["GET"])
@router.route("/", methods=["GET"])
def get_predictions():
    """
    Returns recent prediction records from PostgreSQL.
    Supports filtering by task_type (?type=clustering or ?task_type=clustering) and limit.
    """
    task_type = request.args.get("task_type") or request.args.get("type")
    limit = int(request.args.get("limit", 20))

    if SessionLocal is None:
        return jsonify({
            "status": "error",
            "message": "Database session factory is not initialized.",
            "predictions": []
        }), 503

    db = SessionLocal()
    try:
        query = db.query(PredictionRecord)
        if task_type:
            query = query.filter(PredictionRecord.task_type == task_type)

        records = query.order_by(PredictionRecord.created_at.desc()).limit(limit).all()

        results = []
        for r in records:
            results.append({
                "id": r.id,
                "task_type": r.task_type,
                "prediction": r.prediction,
                "features": r.features,
                "confidence": r.confidence,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None
            })

        return jsonify({
            "status": "success",
            "count": len(results),
            "predictions": results
        }), 200
    except Exception as e:
        logger.error(f"Error querying prediction records: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve prediction records from database.",
            "predictions": []
        }), 500
    finally:
        db.close()
