"""
Clustering API routes.
Endpoints for wafer pattern clustering inference will be implemented here
after EDA analysis and model training in Google Colab are completed.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/clustering", tags=["Clustering"])
