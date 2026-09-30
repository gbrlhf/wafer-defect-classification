from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])

@router.get("/info")
def get_dataset_info() -> Dict[str, Any]:
    """
    Returns metadata about the semiconductor wafer dataset.
    Feature specifications are populated after Google Colab EDA.
    """
    return {
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
        )
    }
