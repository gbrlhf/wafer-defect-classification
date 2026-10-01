from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ClusteringRequest(BaseModel):
    # Dynamic dictionary to avoid hardcoding feature names before EDA
    features: Dict[str, Any] = Field(
        default_factory=dict,
        description="Feature key-value pairs matching dataset columns for clustering"
    )

class ClusteringResponse(BaseModel):
    status: str = Field(description="Clustering status, e.g., 'success' or 'model_not_ready'")
    cluster_id: Optional[int] = Field(default=None, description="Assigned cluster index/ID")
    cluster_name: Optional[str] = Field(default=None, description="Descriptive cluster label if profiled")
    message: Optional[str] = Field(default=None, description="Informational message or instruction")
