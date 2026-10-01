from flask import Blueprint, jsonify

router = Blueprint("dataset", __name__, url_prefix="/api/dataset")


@router.route("/info", methods=["GET"])
def get_dataset_info():
    """
    Returns metadata about the semiconductor wafer dataset.
    Feature specifications are populated after Google Colab EDA.
    """
    return jsonify({
        "status": "pending_eda",
        "dataset_name": "Semiconductor Wafer Defect Classification Dataset",
        "source": "Kaggle",
        "total_samples": None,
        "total_features": None,
        "features": [],
        "target_column": None,
        "classes": [],
        "description": (
            "Dataset semiconductor wafer defect analysis. "
            "Feature names, sample counts, and target labels will be synchronized "
            "following exploratory data analysis (EDA) and preprocessing in Google Colab."
        ),
    }), 200
