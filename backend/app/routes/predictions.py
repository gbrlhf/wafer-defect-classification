"""
Predictions API routes.
Endpoints for retrieving historical predictions from PostgreSQL will be implemented here
after database models and schemas are finalized.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])
