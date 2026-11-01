"""
Speech & TTS routes for ChaCha-Chaudari.
Exposes /tts, /voices, /fast-tts, /health endpoints.
"""
from __future__ import annotations

import os
import logging
from flask import Blueprint, request, jsonify, send_file
from services.tts_service import TTSService

log = logging.getLogger(__name__)

speech_bp = Blueprint("speech", __name__)
tts_service = TTSService()


@speech_bp.route("/voices", methods=["GET"])
def get_voices():
    """Return available TTS voices."""
    try:
        voices = tts_service.list_voices()
        return jsonify({"voices": voices, "count": len(voices)})
    except Exception as e:
        log.error("Failed to list voices: %s", e)
        return jsonify({"error": "Failed to list voices", "voices": []}), 500


@speech_bp.route("/tts", methods=["POST"])
@speech_bp.route("/fast-tts", methods=["POST"])
def synthesize_speech():
    """Synthesize speech from request JSON."""
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    voice = data.get("voice")
    lang = data.get("lang")
    rate = data.get("rate")

    if not text:
        return jsonify({"error": "Missing 'text' in request body"}), 400

    try:
        if rate is not None:
            rate = float(rate)
    except (TypeError, ValueError):
        rate = None

    try:
        out_path, mimetype, engine_label = tts_service.synthesize(
            text=text,
            voice_id=voice,
            lang=lang,
            rate=rate,
        )

        response = send_file(out_path, mimetype=mimetype)
        response.headers["X-TTS-Engine"] = engine_label
        response.headers["Access-Control-Expose-Headers"] = "X-TTS-Engine"
        return response
    except Exception as e:
        log.error("TTS synthesis error: %s", e)
        return jsonify({"error": "TTS synthesis failed", "details": str(e)}), 500


@speech_bp.route("/speech/health", methods=["GET"])
def speech_health():
    voices = tts_service.list_voices()
    return jsonify({
        "status": "ok",
        "piper_ready": os.path.isfile(tts_service.piper_path),
        "voices_count": len(voices),
    })

