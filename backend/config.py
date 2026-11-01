"""
Centralized Backend Configuration for ChaCha-Chaudari / SmartGanga Mascot.
Loads environment variables safely with robust defaults and validation.
"""
from __future__ import annotations

import os
import secrets
import logging
from typing import List
from dotenv import load_dotenv

# Load .env file from backend directory or project root
load_dotenv()

log = logging.getLogger(__name__)

class Config:
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))
    DEBUG: bool = os.getenv("FLASK_DEBUG", "0") in ("1", "true", "True")

    # CORS configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    _DEFAULT_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cha-cha-chaudari.vercel.app",
    ]
    @classmethod
    def get_cors_origins(cls) -> List[str]:
        if cls.FRONTEND_URL:
            origins = [o.strip() for o in cls.FRONTEND_URL.split(",") if o.strip()]
            for d in cls._DEFAULT_ORIGINS:
                if d not in origins:
                    origins.append(d)
            return origins
        return cls._DEFAULT_ORIGINS

    # Authentication & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    if not SECRET_KEY:
        SECRET_KEY = secrets.token_hex(32)
        log.warning("SECRET_KEY not set in environment; generated ephemeral session key.")

    ADMIN_CODE: str = os.getenv("ADMIN_CODE", "letmein-admin")
    TOKEN_EXP_HOURS: int = int(os.getenv("TOKEN_EXP_HOURS", "24"))

    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "capstone_db")

    # Directories
    BASE_DIR: str = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR: str = os.path.join(BASE_DIR, "Data")
    VOICES_DIR: str = os.path.join(BASE_DIR, "voices", "piper")

    # LLM Settings & Provider Selection
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter").strip().lower()  # "openrouter" or "local"
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")

    DEFAULT_MODEL_NAME: str = os.getenv("MODEL_PATH", "microsoft/Phi-3-mini-4k-instruct")
    FALLBACK_MODEL_NAME: str = os.getenv("FALLBACK_MODEL_PATH", "meta-llama/Llama-2-7b-chat-hf")
    USE_4BIT: bool = os.getenv("USE_4BIT", "1").lower() in ("1", "true", "yes")
    FORCE_CPU: bool = os.getenv("FORCE_CPU", "0").lower() in ("1", "true", "yes")

    # RAG Settings
    RAG_EMBED_DIM: int = int(os.getenv("RAG_EMBED_DIM", "384"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "3"))

    # TTS Settings
    TTS_BACKEND: str = os.getenv("TTS_BACKEND", "piper").strip().lower()
    TTS_PROXY_PORT: int = int(os.getenv("TTS_PROXY_PORT", "6001"))
    PIPER_PATH: str = os.getenv("PIPER_PATH") or os.path.join(BASE_DIR, "piper", "piper.exe")

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "1").lower() in ("1", "true")
    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "120/minute")
    RATE_LIMIT_LLM: str = os.getenv("RATE_LIMIT_LLM", "30/minute")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

# Ensure critical data directories exist
os.makedirs(Config.DATA_DIR, exist_ok=True)
os.makedirs(Config.VOICES_DIR, exist_ok=True)

