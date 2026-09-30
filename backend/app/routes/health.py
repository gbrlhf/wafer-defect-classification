from fastapi import APIRouter
from ..schemas.common import HealthResponse

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    Health check endpoint to verify backend service availability.
    """
    return HealthResponse(
        status="ok",
        service="wafer-defect-api"
    )
