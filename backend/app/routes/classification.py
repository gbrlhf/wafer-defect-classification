from flask import Blueprint, jsonify, request
from ..services.classification_service import classification_service

router = Blueprint("classification", __name__, url_prefix="/api/classification")


@router.route("/predict", methods=["POST"])
def predict_defect():
    """
    Executes supervised classification inference on provided wafer features.
    Returns predicted class (0: Normal, 1: Defect), confidence score, and probabilities.
    """
    data = request.get_json(silent=True) or {}
    features = data.get("features", data)
    result = classification_service.predict(features)
    return jsonify(result), 200
