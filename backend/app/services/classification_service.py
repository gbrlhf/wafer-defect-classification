import logging
from typing import Dict, Any
import numpy as np
import pandas as pd
from .model_service import model_service

logger = logging.getLogger(__name__)

class ClassificationService:
    """
    Handles feature preprocessing, classification inference,
    and probability scoring using trained Scikit-learn models.
    """

    def __init__(self):
        self.model_service = model_service

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes prediction on the provided features dictionary.
        Returns clear instructions if model is not yet placed in app/models.
        """
        classifier = self.model_service.get_classifier()
        scaler = self.model_service.get_scaler()

        if classifier is None:
            return {
                "status": "pending_model",
                "prediction": None,
                "confidence": None,
                "message": (
                    "Classification model ('classifier.joblib') is not yet available. "
                    "Please complete training and export in Google Colab, then place the file in backend/app/models/."
                )
            }

        if not features:
            return {
                "status": "error",
                "prediction": None,
                "confidence": None,
                "message": "Input feature dictionary cannot be empty."
            }

        try:
            # Convert incoming dictionary into a single-row DataFrame
            input_df = pd.DataFrame([features])

            # Apply scaler preprocessing if trained scaler exists
            if scaler is not None:
                transformed_data = scaler.transform(input_df)
            else:
                transformed_data = input_df

            # Predict label
            prediction_val = classifier.predict(transformed_data)
            prediction_label = str(prediction_val[0])

            # Calculate probability / confidence if supported by model
            confidence_val = None
            if hasattr(classifier, "predict_proba"):
                probabilities = classifier.predict_proba(transformed_data)
                confidence_val = float(np.max(probabilities[0]))

            return {
                "status": "success",
                "prediction": prediction_label,
                "confidence": confidence_val,
                "message": "Inference completed successfully."
            }

        except Exception as e:
            logger.error(f"Inference error in classification: {e}")
            return {
                "status": "error",
                "prediction": None,
                "confidence": None,
                "message": f"Inference execution failed: {str(e)}"
            }

classification_service = ClassificationService()
