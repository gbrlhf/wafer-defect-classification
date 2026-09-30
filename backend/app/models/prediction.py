from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from ..core.database import Base

class PredictionRecord(Base):
    """
    Stores inference requests and outputs for wafer defect classification
    and clustering for tracking, inspection history, and auditing.
    """
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_type = Column(String(50), nullable=False, index=True) # 'classification' or 'clustering'
    features = Column(JSON, nullable=False) # Ingested wafer measurement features
    prediction = Column(String(100), nullable=False) # e.g. defect label or cluster ID
    confidence = Column(Float, nullable=True) # Confidence / probability score if available
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<PredictionRecord(id={self.id}, task='{self.task_type}', prediction='{self.prediction}')>"
