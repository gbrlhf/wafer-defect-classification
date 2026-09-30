import logging
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", summary="General service health check")
def health_check():
    """
    Basic service health check endpoint.
    Operates independently without requiring active database connections.
    """
    return {
        "status": "ok",
        "service": "wafer-defect-api",
    }


@router.get("/database", summary="PostgreSQL database connectivity check")
def database_health_check():
    """
    Checks connection to PostgreSQL database by executing a lightweight SELECT 1 query.
    Returns status ok when connected, or error status when disconnected without exposing credentials.
    """
    if SessionLocal is None:
        logger.warning("Database health check failed: SessionLocal is not initialized (DATABASE_URL may be missing).")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "disconnected"},
        )

    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        # Log generic error message internally without leaking credentials to client
        logger.error("Database connection check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "disconnected"},
        )
