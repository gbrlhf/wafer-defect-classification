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

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["APP_NAME"] = "Wafer Defect Classification API"
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


# Register API Blueprints
app.register_blueprint(health_router)
app.register_blueprint(dataset_router)
app.register_blueprint(model_router)
app.register_blueprint(classification_router)
app.register_blueprint(clustering_router)


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Wafer Defect Classification API",
        "version": "1.0.0",
        "health": "/api/health",
        "database_health": "/api/health/database",
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=settings.API_PORT,
        debug=settings.APP_ENV == "development",
    )
