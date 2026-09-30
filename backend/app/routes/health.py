from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", summary="General service health check")
def health_check():
    """
    Basic health check endpoint.
    Operates independently without requiring active database connections.
    """
    return {
        "status": "ok",
        "service": "wafer-defect-api",
    }
