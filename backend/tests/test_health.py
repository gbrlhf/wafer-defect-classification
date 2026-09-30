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
