import json

def test_llama_chat_missing_prompt(client):
    """Test /llama-chat returns 400 when prompt is empty or omitted."""
    response = client.post("/llama-chat", json={"prompt": ""})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data

def test_llama_chat_generation(client):
    """Test /llama-chat returns persona-adaptive response."""
    payload = {
        "prompt": "How can I keep the Ganga clean?",
        "ageGroup": "kid",
        "lang": "en"
    }
    response = client.post("/llama-chat", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "response" in data
    assert len(data["response"]) > 0
    assert "sources" in data

def test_llama_chat_hindi_query(client):
    """Test /llama-chat handles Hindi queries."""
    payload = {
        "prompt": "गंगा नदी को स्वच्छ रखने के क्या उपाय हैं?",
        "ageGroup": "adult",
        "lang": "hi"
    }
    response = client.post("/llama-chat", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_llama_chat_stream(client):
    """Test /llama-chat-stream returns NDJSON streaming chunks."""
    payload = {
        "prompt": "What is the Namami Gange project?",
        "ageGroup": "teen",
        "lang": "en"
    }
    response = client.post("/llama-chat-stream", json=payload)
    assert response.status_code == 200
    assert "application/x-ndjson" in response.content_type

    chunks = [line for line in response.get_data(as_text=True).split("\n") if line.strip()]
    assert len(chunks) > 0
    # First chunk or some chunk should be valid JSON
    first_obj = json.loads(chunks[0])
    assert "token" in first_obj or "error" in first_obj

