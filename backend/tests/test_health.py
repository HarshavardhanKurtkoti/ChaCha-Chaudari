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

def test_health_cors_is_public(client):
    """Verify that /health responds with public CORS for monitoring services."""
    response = client.get("/health", headers={"Origin": "https://external-uptime-monitor.io"})
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") in ("*", "https://external-uptime-monitor.io")

def test_api_routes_enforce_origin_restriction(client):
    """Verify that non-health routes do NOT allow unauthorized arbitrary origins."""
    response = client.post(
        "/llama-chat",
        headers={"Origin": "https://malicious-unauthorized-site.com"},
        json={"prompt": "hello"}
    )
    # The header should either be absent or not match the unauthorized origin
    assert response.headers.get("Access-Control-Allow-Origin") != "https://malicious-unauthorized-site.com"
