from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class PredictionRecordBase(BaseModel):
    task_type: str = Field(description="Type of task: 'classification' or 'clustering'")
    features: Dict[str, Any] = Field(description="Wafer input features map")
    prediction: str = Field(description="Predicted label or cluster assignment")
    confidence: Optional[float] = Field(default=None, description="Prediction confidence score")

class PredictionRecordCreate(PredictionRecordBase):
    pass

class PredictionRecordResponse(PredictionRecordBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
