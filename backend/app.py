"""
ChaCha-Chaudari / SmartGanga Mascot Main Flask Application.
Modular, production-ready, demo-ready application factory.
"""
from __future__ import annotations

import os
import sys
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import Config
from auth import auth_bp
from chat_routes import chat_bp as chat_persistence_bp
from routes.chat import chat_bp
from routes.speech import speech_bp
from game_routes import game_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
log = logging.getLogger("smartganga-backend")


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["JSON_AS_ASCII"] = False

    # 1. Setup CORS
    allowed_origins = Config.get_cors_origins()
    CORS(
        app,
        origins=allowed_origins,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True,
        max_age=86400,
    )
    log.info("Configured CORS for origins: %s", allowed_origins)

    # 2. Setup Rate Limiting (Phase 22)
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address

        limiter = Limiter(
            get_remote_address,
            app=app,
            default_limits=[Config.RATE_LIMIT_DEFAULT],
            storage_uri="memory://",
        )
        # Apply specific limits to heavy AI endpoints
        limiter.limit(Config.RATE_LIMIT_LLM)(chat_bp)
        log.info("Rate limiting enabled (%s default, %s LLM)", Config.RATE_LIMIT_DEFAULT, Config.RATE_LIMIT_LLM)
    except Exception as e:
        log.warning("Rate limiter could not be initialized; proceeding without limiter: %s", e)

    # 3. Register Blueprints
    # Auth endpoints at /auth/*
    app.register_blueprint(auth_bp)
    # Chat persistence at /chats/*
    app.register_blueprint(chat_persistence_bp)
    # AI Chat at / and /api
    app.register_blueprint(chat_bp)
    app.register_blueprint(chat_bp, name="api_chat", url_prefix="/api")
    # TTS & Speech at / and /api
    app.register_blueprint(speech_bp)
    app.register_blueprint(speech_bp, name="api_speech", url_prefix="/api")
    # Gamification & Location at / and /api
    app.register_blueprint(game_bp)
    app.register_blueprint(game_bp, name="api_game", url_prefix="/api")

    # 4. Root & Health Check Endpoints
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "name": "SmartGanga Mascot API",
            "character": "Chacha Chaudhary",
            "version": "2.0.0",
            "status": "online",
            "endpoints": [
                "/llama-chat",
                "/llama-chat-stream",
                "/tts",
                "/voices",
                "/game/progress",
                "/game/score",
                "/game/daily-reward",
                "/game/leaderboard",
                "/updateLocation",
                "/auth/*",
                "/chats/*",
                "/health",
            ],
        })

    @app.route("/health", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        from datetime import datetime, timezone
        return jsonify({
            "status": "healthy",
            "service": "SmartGanga Backend",
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mongodb_connected": not getattr(sys.modules.get("db"), "_USING_IN_MEMORY_DB", False),
        })

    # 5. Error Handlers (Phase 13 / 21: safe error JSON, no stack traces leaked)
    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({"error": "Bad request", "message": str(err.description if hasattr(err, "description") else err)}), 400

    @app.errorhandler(404)
    def not_found(err):
        return jsonify({"error": "Not found", "message": "The requested API endpoint was not found"}), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded", "message": "Too many requests. Please slow down."}), 429

    @app.errorhandler(500)
    def internal_error(err):
        log.error("Internal Server Error: %s", err)
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred"}), 500

    log.info("SmartGanga Mascot Flask app initialized successfully.")
    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
    )
