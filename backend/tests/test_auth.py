import json
import jwt

def test_register_success(client):
    """Test user registration with valid details."""
    payload = {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "Password123!",
        "age": 14
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["email"] == "arjun@example.com"
    assert data["name"] == "Arjun Sharma"
    assert "token" in data
    assert "password" not in data

def test_register_duplicate_email(client):
    """Test registering with an existing email returns 409 Conflict."""
    payload = {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "Password123!"
    }
    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data

def test_register_missing_fields(client):
    """Test registering with missing required fields returns 400 Bad Request."""
    response = client.post("/auth/register", json={"email": "incomplete@example.com"})
    assert response.status_code == 400

def test_login_success(client):
    """Test user login with valid credentials."""
    client.post("/auth/register", json={
        "name": "Priya Singh",
        "email": "priya@example.com",
        "password": "SecurePassword99"
    })

    login_resp = client.post("/auth/login", json={
        "email": "priya@example.com",
        "password": "SecurePassword99"
    })
    assert login_resp.status_code == 200
    data = login_resp.get_json()
    assert data["email"] == "priya@example.com"
    assert "token" in data

def test_login_invalid_password(client):
    """Test login with wrong password returns 401."""
    client.post("/auth/register", json={
        "name": "Priya Singh",
        "email": "priya2@example.com",
        "password": "SecurePassword99"
    })

    login_resp = client.post("/auth/login", json={
        "email": "priya2@example.com",
        "password": "WrongPassword"
    })
    assert login_resp.status_code == 401

def test_google_login(client):
    """Test Google token login and user upsert."""
    fake_google_token = jwt.encode(
        {"email": "gangafan@gmail.com", "name": "Ganga Fan", "sub": "google-sub-456"},
        key="fake",
        algorithm="HS256"
    )
    response = client.post("/auth/google-login", json={"googleToken": fake_google_token})
    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "gangafan@gmail.com"
    assert "token" in data

def test_me_protected_route(client):
    """Test /auth/me returns user profile with valid Bearer token."""
    reg = client.post("/auth/register", json={
        "name": "Ganga Champion",
        "email": "champion@example.com",
        "password": "Password123!"
    })
    token = reg.get_json()["token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "champion@example.com"

def test_me_unauthorized(client):
    """Test /auth/me returns 401 when Authorization header is absent."""
    response = client.get("/auth/me")
    assert response.status_code == 401

