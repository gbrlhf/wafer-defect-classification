"""
Classification API routes.
Endpoints for wafer defect classification inference will be implemented here
after EDA analysis and model training in Google Colab are completed.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/classification", tags=["Classification"])
