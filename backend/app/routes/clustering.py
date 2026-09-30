from fastapi import APIRouter
from ..schemas.clustering import ClusteringRequest, ClusteringResponse
from ..services.clustering_service import clustering_service

router = APIRouter(prefix="/api/clustering", tags=["Clustering"])

@router.post("/predict", response_model=ClusteringResponse)
def predict_cluster(request: ClusteringRequest) -> ClusteringResponse:
    """
    Executes unsupervised clustering assignment on provided wafer features.
    If model has not yet been exported from Google Colab, returns instructions.
    """
    result = clustering_service.predict(request.features)
    return ClusteringResponse(
        status=result["status"],
        cluster_id=result.get("cluster_id"),
        cluster_name=result.get("cluster_name"),
        message=result.get("message")
    )
