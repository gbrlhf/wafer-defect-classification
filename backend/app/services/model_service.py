import json
import logging
import pickle
import sys
from pathlib import Path
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)

# Ensure compatibility shim for ColumnTransformer pickled in Scikit-Learn 1.6
try:
    import sklearn.compose._column_transformer
    if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
        class _RemainderColsList(list):
            pass
        sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList
except Exception as e:
    logger.debug(f"ColumnTransformer shim notice: {e}")


class ModelService:
    """
    Manages loading and caching of trained Machine Learning models (Supervised,
    Unsupervised, and Reinforcement Learning).
    Ensures model artifacts are loaded into memory once (Singleton) and prevents
    reloading on every HTTP request.
    Gracefully handles absence of model files prior to training export.
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
        self._rl_metadata: Optional[Dict[str, Any]] = None
        self._rl_qtable: Optional[Any] = None
        self._cluster_profiles: Optional[Dict[str, Any]] = None

    def _load_joblib_file(self, filename: str) -> Optional[Any]:
        filepath = self.models_dir / filename
        if not filepath.exists() or not filepath.is_file():
            logger.info(f"Model file '{filename}' not found at {filepath}.")
            return None

        try:
            import joblib
            loaded_model = joblib.load(filepath)
            logger.info(f"Successfully loaded '{filename}' from {filepath}")
            return loaded_model
        except Exception as e:
            logger.error(f"Error loading joblib model '{filename}' from {filepath}: {e}")
            return None

    def _load_pickle_file(self, filename: str) -> Optional[Any]:
        filepath = self.models_dir / filename
        if not filepath.exists() or not filepath.is_file():
            logger.info(f"Pickle file '{filename}' not found at {filepath}.")
            return None

        try:
            with open(filepath, "rb") as f:
                loaded_obj = pickle.load(f)
            logger.info(f"Successfully loaded pickle '{filename}' from {filepath}")
            return loaded_obj
        except Exception as e:
            try:
                import joblib
                return joblib.load(filepath)
            except Exception:
                logger.error(f"Error loading pickle file '{filename}' from {filepath}: {e}")
                return None

    def get_classifier(self) -> Optional[Any]:
        """Returns the trained supervised classification model or None if not available."""
        if self._classifier is None:
            self._classifier = self._load_joblib_file("classifier.joblib")
        return self._classifier

    def get_scaler(self) -> Optional[Any]:
        """Returns the trained feature scaler or None if not available."""
        if self._scaler is None:
            self._scaler = self._load_joblib_file("scaler.joblib")
        return self._scaler

    def get_clustering(self) -> Optional[Any]:
        """
        Returns the trained unsupervised clustering model pipeline (KMeans pipeline),
        or None if not available.
        """
        if self._clustering is None:
            pipeline = self._load_joblib_file("kmeans_pipeline.pkl")
            if pipeline is None:
                pipeline = self._load_joblib_file("clustering.joblib")
            self._clustering = pipeline
        return self._clustering

    def get_cluster_profiles(self) -> Optional[Dict[str, Any]]:
        """Returns the cluster statistical profiles dictionary if available."""
        if self._cluster_profiles is None:
            profile_path = self.models_dir / "cluster_profiles.json"
            if profile_path.exists():
                try:
                    with open(profile_path, "r", encoding="utf-8") as f:
                        self._cluster_profiles = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load cluster_profiles.json: {e}")
        return self._cluster_profiles

    def get_rl_metadata(self) -> Optional[Dict[str, Any]]:
        """Returns metadata for Reinforcement Learning process control."""
        if self._rl_metadata is None:
            self._rl_metadata = self._load_pickle_file("rl_semiconductor_metadata.pkl")
        return self._rl_metadata

    def get_rl_qtable(self) -> Optional[Any]:
        """Returns trained Q-table numpy array for Reinforcement Learning process control."""
        if self._rl_qtable is None:
            self._rl_qtable = self._load_joblib_file("rl_semiconductor_qtable.pkl")
            if self._rl_qtable is None:
                self._rl_qtable = self._load_pickle_file("rl_semiconductor_qtable.pkl")
        return self._rl_qtable

    def get_models_status(self) -> Dict[str, Any]:
        """Provides status report of all model artifacts across the three ML paradigms."""
        classifier_path = self.models_dir / "classifier.joblib"
        scaler_path = self.models_dir / "scaler.joblib"
        clustering_path = self.models_dir / "kmeans_pipeline.pkl"
        if not clustering_path.exists():
            clustering_path = self.models_dir / "clustering.joblib"
        rl_meta_path = self.models_dir / "rl_semiconductor_metadata.pkl"
        rl_qtable_path = self.models_dir / "rl_semiconductor_qtable.pkl"

        return {
            "models_directory": str(self.models_dir),
            "supervised": {
                "name": "Supervised Defect Classifier (RandomForest)",
                "available": classifier_path.exists() and scaler_path.exists(),
                "classifier_file": "classifier.joblib",
                "scaler_file": "scaler.joblib",
            },
            "unsupervised": {
                "name": "K-Means Clustering Pipeline",
                "available": clustering_path.exists(),
                "file": clustering_path.name if clustering_path.exists() else "kmeans_pipeline.pkl",
                "profiles_available": (self.models_dir / "cluster_profiles.json").exists(),
            },
            "reinforcement_learning": {
                "name": "Q-Learning Semiconductor Control Optimizer",
                "available": rl_meta_path.exists() and rl_qtable_path.exists(),
                "metadata_file": "rl_semiconductor_metadata.pkl",
                "qtable_file": "rl_semiconductor_qtable.pkl",
            },
            "ready_for_inference": classifier_path.exists() and clustering_path.exists() and rl_qtable_path.exists(),
        }

    def reload(self) -> None:
        """Forces cache invalidation to reload newly exported models."""
        self._classifier = None
        self._scaler = None
        self._clustering = None
        self._rl_metadata = None
        self._rl_qtable = None
        self._cluster_profiles = None
        logger.info("Model cache invalidated. Next request will reload from disk.")


# Singleton instance for application use
model_service = ModelService()
