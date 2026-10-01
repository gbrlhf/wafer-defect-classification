from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ModelMetricsBase(BaseModel):
    model_name: str = Field(description="Name or type of model, e.g. 'classifier', 'clustering'")
    version: str = Field(default="1.0.0", description="Model version tag")
    accuracy: Optional[float] = Field(default=None, description="Accuracy score for classification")
    f1_score: Optional[float] = Field(default=None, description="F1-score for classification")
    precision: Optional[float] = Field(default=None, description="Precision score")
    recall: Optional[float] = Field(default=None, description="Recall score")
    silhouette_score: Optional[float] = Field(default=None, description="Silhouette score for clustering")
    parameters: Optional[Dict[str, Any]] = Field(default=None, description="Hyperparameters or training config")

class ModelMetricsCreate(ModelMetricsBase):
    pass

class ModelMetricsResponse(ModelMetricsBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
