import logging
from flask import Blueprint, jsonify
from sqlalchemy import text
from ..core.database import SessionLocal

logger = logging.getLogger(__name__)

router = Blueprint("health", __name__, url_prefix="/api/health")


@router.route("", methods=["GET"])
def health_check():
    """
    General service health check endpoint.
    Operates independently without requiring active database connections.
    """
    return jsonify({
        "status": "ok",
        "service": "wafer-defect-api",
    }), 200


@router.route("/database", methods=["GET"])
def database_health_check():
    """
    Checks connection to PostgreSQL database by executing a lightweight SELECT 1 query.
    Returns status ok when connected, or error status when disconnected without exposing credentials.
    """
    if SessionLocal is None:
        logger.warning("Database health check failed: SessionLocal is not initialized.")
        return jsonify({
            "status": "error",
            "database": "disconnected",
        }), 503

    try:
        session = SessionLocal()
        session.execute(text("SELECT 1"))
        return jsonify({
            "status": "ok",
            "database": "connected",
        }), 200
    except Exception as exc:
        logger.error(f"PostgreSQL connection verification failed: {type(exc).__name__}")
        return jsonify({
            "status": "error",
            "database": "disconnected",
        }), 503
    finally:
        if SessionLocal is not None:
            SessionLocal.remove()
