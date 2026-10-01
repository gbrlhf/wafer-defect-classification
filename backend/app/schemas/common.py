from typing import Optional, Any, Dict
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="ok", examples=["ok"])
    service: str = Field(default="wafer-defect-api", examples=["wafer-defect-api"])
    database: Optional[str] = Field(default=None, examples=["connected"])

class MessageResponse(BaseModel):
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
