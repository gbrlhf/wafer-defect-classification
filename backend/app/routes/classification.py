from flask import Blueprint, jsonify, request
from ..services.classification_service import classification_service

router = Blueprint("classification", __name__, url_prefix="/api/classification")


@router.route("/predict", methods=["POST"])
def predict_defect():
    """
    Executes supervised classification inference on provided wafer features.
    Returns predicted class (0: Normal, 1: Defect), confidence score, and probabilities.
    Validates payload and returns structured JSON with appropriate HTTP status codes.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "success": False,
            "status": "error",
            "error_code": "INVALID_JSON",
            "message": "Invalid request body. Expected application/json payload.",
        }), 400

    features = data.get("features", data)
    if not isinstance(features, dict) or not features:
        return jsonify({
            "success": False,
            "status": "error",
            "error_code": "EMPTY_PAYLOAD",
            "message": "Input parameter sensor wafer tidak boleh kosong.",
        }), 400

    result, status_code = classification_service.predict(features)
    return jsonify(result), status_code
