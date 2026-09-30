import os
import logging
from pathlib import Path
from typing import Optional, Any, Dict
import joblib

logger = logging.getLogger(__name__)

class ModelService:
    """
    Manages loading and caching of trained Machine Learning models from .joblib files.
    Ensures models are only loaded into memory once and prevents reloading on every request.
    Gracefully handles absence of model files prior to Google Colab training completion.
    """

    def __init__(self, models_dir: Optional[str] = None):
        if models_dir is None:
            # Default to backend/app/models relative to this file
            self.models_dir = Path(__file__).resolve().parent.parent / "models"
        else:
            self.models_dir = Path(models_dir)

        self._classifier: Optional[Any] = None
        self._scaler: Optional[Any] = None
        self._clustering: Optional[Any] = None

    def _load_joblib_file(self, filename: str) -> Optional[Any]:
        filepath = self.models_dir / filename
        if not filepath.exists() or not filepath.is_file():
            logger.info(f"Model file '{filename}' not found at {filepath}. Pending Google Colab training export.")
            return None

        try:
            loaded_model = joblib.load(filepath)
            logger.info(f"Successfully loaded '{filename}' from {filepath}")
            return loaded_model
        except Exception as e:
            logger.error(f"Error loading model '{filename}' from {filepath}: {e}")
            return None

    def get_classifier(self) -> Optional[Any]:
        """Returns the trained classifier model or None if not available."""
        if self._classifier is None:
            self._classifier = self._load_joblib_file("classifier.joblib")
        return self._classifier

    def get_scaler(self) -> Optional[Any]:
        """Returns the trained feature scaler or None if not available."""
        if self._scaler is None:
            self._scaler = self._load_joblib_file("scaler.joblib")
        return self._scaler

    def get_clustering(self) -> Optional[Any]:
        """Returns the trained clustering model or None if not available."""
        if self._clustering is None:
            self._clustering = self._load_joblib_file("clustering.joblib")
        return self._clustering

    def get_models_status(self) -> Dict[str, Any]:
        """Provides status report of all model artifacts without loading heavy objects unnecessarily."""
        classifier_path = self.models_dir / "classifier.joblib"
        scaler_path = self.models_dir / "scaler.joblib"
        clustering_path = self.models_dir / "clustering.joblib"

        return {
            "models_directory": str(self.models_dir),
            "classifier_available": classifier_path.exists(),
            "scaler_available": scaler_path.exists(),
            "clustering_available": clustering_path.exists(),
            "ready_for_inference": classifier_path.exists() and clustering_path.exists()
        }

    def reload(self) -> None:
        """Forces cache invalidation to reload newly exported models."""
        self._classifier = None
        self._scaler = None
        self._clustering = None
        logger.info("Model cache invalidated. Next request will reload from disk.")

# Singleton instance for application use
model_service = ModelService()
