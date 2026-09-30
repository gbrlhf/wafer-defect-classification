from fastapi import APIRouter
from ..schemas.common import HealthResponse
from ..core.database import check_db_connection

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    Health check endpoint to verify backend service and database availability.
    """
    db_status = check_db_connection()
    return HealthResponse(
        status="ok",
        service="wafer-defect-api",
        database=db_status.get("status")
    )
