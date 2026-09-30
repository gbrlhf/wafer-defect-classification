from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """
    Test that general health check returns ok and does not depend on database.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "wafer-defect-api",
    }
def test_database_health_check_disconnected():
    """
    Test that database health check returns disconnected status when DB is not reachable.
    """
    response = client.get("/api/health/database")
    assert response.status_code == 503
    assert response.json() == {
        "status": "error",
        "database": "disconnected",
    }
