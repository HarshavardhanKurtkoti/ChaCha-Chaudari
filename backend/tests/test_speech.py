def test_voices_endpoint(client):
    """Test /voices endpoint returns available voices."""
    response = client.get("/voices")
    assert response.status_code == 200
    data = response.get_json()
    assert "voices" in data
    assert isinstance(data["voices"], list)

def test_speech_health_endpoint(client):
    """Test /speech/health endpoint."""
    response = client.get("/speech/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("status") == "ok"
    assert "piper_ready" in data
    assert "voices_count" in data

def test_tts_missing_text(client):
    """Test /tts returns 400 when text payload is missing."""
    response = client.post("/tts", json={})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data

def test_tts_synthesis_fallback(client):
    """Test /tts generates audio or handles fallback gracefully."""
    response = client.post("/tts", json={"text": "Clean Ganga, Green India", "lang": "en"})
    # Either returns audio (200) or clean error if no engine is installed in minimal test env
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        assert response.content_type in ("audio/wav", "audio/mpeg", "audio/ogg")
        assert len(response.data) > 0
