def test_health_endpoint(client):
    """Test standard root health check."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert data.get("status") in ("healthy", "ok")
    assert "timestamp" in data
    assert "version" in data

def test_api_health_endpoint(client):
    """Test /api/health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("status") in ("healthy", "ok")

def test_not_found_envelope(client):
    """Test 404 handler returns clean JSON error envelope."""
    response = client.get("/non-existent-route-xyz")
    assert response.status_code == 404
    data = response.get_json()
    assert data is not None
    assert "error" in data
    assert data.get("status") == 404 or data.get("error") == "Not found"
