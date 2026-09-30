from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "wafer-defect-api"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"

def test_dataset_info_pending():
    response = client.get("/api/dataset/info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending_eda"

def test_classification_pending_model():
    response = client.post("/api/classification/predict", json={"features": {"test_col": 1.0}})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending_model"

def test_clustering_pending_model():
    response = client.post("/api/clustering/predict", json={"features": {"test_col": 1.0}})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending_model"
