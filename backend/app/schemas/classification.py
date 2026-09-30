from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ClassificationRequest(BaseModel):
    # Dynamic dictionary to avoid hardcoding feature names before EDA
    features: Dict[str, Any] = Field(
        default_factory=dict,
        description="Feature key-value pairs matching dataset columns determined after EDA"
    )

class ClassificationResponse(BaseModel):
    status: str = Field(description="Inference status, e.g., 'success' or 'model_not_ready'")
    prediction: Optional[str] = Field(default=None, description="Predicted defect category/label")
    confidence: Optional[float] = Field(default=None, description="Prediction confidence/probability if available")
    message: Optional[str] = Field(default=None, description="Informational message or instruction")
