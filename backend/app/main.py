import logging
from flask import Flask, jsonify
from flask_cors import CORS
from .core.config import settings
from .core.database import SessionLocal
from .routes.health import router as health_router
from .routes.dataset import router as dataset_router
from .routes.model import router as model_router
from .routes.classification import router as classification_router
from .routes.clustering import router as clustering_router
from .routes.control import router as control_router
from .routes.prediction import router as prediction_router

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["APP_NAME"] = "Wafer Defect Classification & Process Control API"
app.config["VERSION"] = "1.0.0"

# CORS configuration
if settings.cors_origins:
    CORS(app, resources={r"/api/*": {"origins": settings.cors_origins}})
else:
    CORS(app)


# Cleanup database session per request context
@app.teardown_appcontext
def shutdown_session(exception=None):
    if SessionLocal is not None:
        SessionLocal.remove()


# Register API Blueprints across all 3 Machine Learning paradigms
app.register_blueprint(health_router)
app.register_blueprint(dataset_router)
app.register_blueprint(model_router)
# Support plural alias /api/models as well
app.register_blueprint(model_router, name="models_alias", url_prefix="/api/models")
app.register_blueprint(classification_router)
app.register_blueprint(clustering_router)
app.register_blueprint(control_router)
app.register_blueprint(prediction_router)


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Wafer Defect Classification & Process Control API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "models_status": "/api/models/status",
            "classification": "/api/classification/predict",
            "clustering": "/api/clustering/predict",
            "clustering_profiles": "/api/clustering/profiles",
            "clustering_history": "/api/clustering/history",
            "predictions": "/api/predictions",
            "control_optimization": "/api/control-optimization/recommend",
            "control_info": "/api/control-optimization/info",
        }
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=settings.API_PORT,
        debug=settings.APP_ENV == "development",
    )
