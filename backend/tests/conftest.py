import os
import sys
from pathlib import Path
import pytest
import jwt
from datetime import datetime, timezone, timedelta

# Ensure backend directory and project root are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
project_root = backend_dir.parent
for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Set testing environment variables before importing app
os.environ["FLASK_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-32-bytes-minimum-length-chacha"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/test_chachadb"
os.environ["ENABLE_LOCAL_LLM"] = "false"

from app import create_app
from db import users_collection, game_progress_collection, location_collection, chats_collection

@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask application for testing."""
    test_app = create_app()
    test_app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test-secret-key-32-bytes-minimum-length-chacha",
    })
    return test_app

@pytest.fixture
def client(app):
    """Test client fixture."""
    return app.test_client()

@pytest.fixture(autouse=True)
def clean_db():
    """Clean test database collections before each test."""
    try:
        users_collection.delete_many({})
        game_progress_collection.delete_many({})
        location_collection.delete_many({})
        chats_collection.delete_many({})
    except Exception:
        pass
    yield

@pytest.fixture
def auth_token():
    """Generate a valid test JWT token."""
    payload = {
        "sub": "test_user_id_123",
        "username": "GangaHero",
        "email": "hero@smartganga.org",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, "test-secret-key-32-bytes-minimum-length-chacha", algorithm="HS256")

@pytest.fixture
def expired_token():
    """Generate an expired JWT token."""
    payload = {
        "sub": "test_user_id_123",
        "username": "ExpiredHero",
        "email": "expired@smartganga.org",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "iat": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    return jwt.encode(payload, "test-secret-key-32-bytes-minimum-length-chacha", algorithm="HS256")
