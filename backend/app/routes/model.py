"""
Model management and metrics API routes.
Endpoints for checking loaded ML model metadata and metrics will be implemented here.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/model", tags=["Model"])
