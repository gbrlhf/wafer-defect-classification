"""
Prediction history and persistence service.
Handles saving prediction results and model metrics into PostgreSQL via SQLAlchemy.
"""

from typing import List, Optional
from sqlalchemy.orm import Session


class PredictionService:
    """
    Handles persisting and querying predictions in PostgreSQL database.
    """

    def __init__(self, db: Session):
        self.db = db


prediction_service = PredictionService
