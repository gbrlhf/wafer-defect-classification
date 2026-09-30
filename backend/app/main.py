from fastapi import FastAPI
from app.routes import api_router

app = FastAPI(
    title="Wafer Defect Classification API",
    version="1.0.0",
    description="REST API backend for Wafer Defect Classification & ML inference",
)

app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Wafer Defect Classification API",
        "docs": "/docs",
        "health": "/api/health",
    }
