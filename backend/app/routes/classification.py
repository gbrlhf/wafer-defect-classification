from flask import Blueprint, jsonify, request
from ..services.classification_service import classification_service

router = Blueprint("classification", __name__, url_prefix="/api/classification")


@router.route("/predict", methods=["POST"])
def predict_defect():
    """
    Executes supervised classification inference on provided wafer features.
    If model has not yet been exported from Google Colab, returns instructions.
    """
    data = request.get_json(silent=True) or {}
    features = data.get("features", {})
    result = classification_service.predict(features)
    return jsonify({
        "status": result.get("status", "pending_model"),
        "prediction": result.get("prediction"),
        "confidence": result.get("confidence"),
        "message": result.get("message"),
    }), 200
