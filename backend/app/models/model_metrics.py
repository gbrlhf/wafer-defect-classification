from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from ..core.database import Base

class ModelMetricRecord(Base):
    """
    Stores versioned evaluation metrics and benchmark summaries
    for trained models exported from Google Colab.
    """
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(100), nullable=False, index=True) # e.g. 'classifier', 'clustering'
    version = Column(String(50), nullable=False, default="1.0.0")
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    silhouette_score = Column(Float, nullable=True)
    parameters = Column(JSON, nullable=True) # Training hyperparameters and metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<ModelMetricRecord(id={self.id}, model='{self.model_name}', version='{self.version}')>"
