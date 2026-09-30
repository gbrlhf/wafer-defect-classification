import logging
from typing import Dict, Any
from .model_service import model_service

logger = logging.getLogger(__name__)


class ClusteringService:
    """
    Handles feature preprocessing, unsupervised clustering inference,
    and cluster assignment using trained Scikit-learn clustering models.
    """

    def __init__(self):
        self.model_service = model_service

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assigns a cluster ID to the input feature profile.
        Returns clear instructions if model is not yet placed in app/models.
        """
        clustering_model = self.model_service.get_clustering()
        scaler = self.model_service.get_scaler()

        if clustering_model is None:
            return {
                "status": "pending_model",
                "cluster_id": None,
                "cluster_name": None,
                "message": (
                    "Clustering model ('clustering.joblib') is not yet available. "
                    "Please complete unsupervised training in Google Colab, then place the file in backend/app/models/."
                ),
            }

        if not features:
            return {
                "status": "error",
                "cluster_id": None,
                "cluster_name": None,
                "message": "Input feature dictionary cannot be empty.",
            }

        try:
            import pandas as pd

            # Convert incoming dictionary into a single-row DataFrame
            input_df = pd.DataFrame([features])

            # Apply scaler preprocessing if trained scaler exists
            if scaler is not None:
                transformed_data = scaler.transform(input_df)
            else:
                transformed_data = input_df

            # Predict cluster ID (e.g., K-Means predict or DBSCAN assignment)
            if hasattr(clustering_model, "predict"):
                cluster_val = int(clustering_model.predict(transformed_data)[0])
            else:
                return {
                    "status": "error",
                    "cluster_id": None,
                    "cluster_name": None,
                    "message": "The loaded clustering model does not support out-of-sample prediction.",
                }

            return {
                "status": "success",
                "cluster_id": cluster_val,
                "cluster_name": f"Cluster {cluster_val}",
                "message": "Clustering assignment completed successfully.",
            }

        except Exception as e:
            logger.error(f"Inference error in clustering: {e}")
            return {
                "status": "error",
                "cluster_id": None,
                "cluster_name": None,
                "message": f"Clustering inference failed: {str(e)}",
            }


clustering_service = ClusteringService()
