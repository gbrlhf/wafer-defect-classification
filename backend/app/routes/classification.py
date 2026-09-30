from fastapi import APIRouter
from ..schemas.classification import ClassificationRequest, ClassificationResponse
from ..services.classification_service import classification_service

router = APIRouter(prefix="/api/classification", tags=["Classification"])

@router.post("/predict", response_model=ClassificationResponse)
def predict_defect(request: ClassificationRequest) -> ClassificationResponse:
    """
    Executes supervised classification inference on provided wafer features.
    If model has not yet been exported from Google Colab, returns instructions.
    """
    result = classification_service.predict(request.features)
    return ClassificationResponse(
        status=result["status"],
        prediction=result.get("prediction"),
        confidence=result.get("confidence"),
        message=result.get("message")
    )
