import pytest
from app.main import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["service"] == "wafer-defect-api"


def test_database_health_endpoint_response_format(client):
    response = client.get("/api/health/database")
    assert response.status_code in [200, 503]
    data = response.get_json()
    if response.status_code == 200:
        assert data == {"status": "ok", "database": "connected"}
    else:
        assert data == {"status": "error", "database": "disconnected"}


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["version"] == "1.0.0"


def test_dataset_info_pending(client):
    response = client.get("/api/dataset/info")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "pending_eda"


def test_classification_pending_model(client):
    response = client.post("/api/classification/predict", json={"features": {"test_col": 1.0}})
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "pending_model"


def test_clustering_pending_model(client):
    response = client.post("/api/clustering/predict", json={"features": {"test_col": 1.0}})
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "pending_model"
