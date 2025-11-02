"""
Standalone TTS microservice.

Runs as a separate Flask app, exposes:
- GET  /health           -> readiness info
- GET  /voices           -> list available voices (Piper)
- POST /speak            -> JSON { text, voice?, lang?, rate? } -> audio/wav

Default backend: Piper (fast, offline). Set env:
  - TTS_BACKEND=piper (default)
  - PIPER_PATH=absolute path to piper.exe (Windows) or 'piper' if in PATH
  - PIPER_VOICES_DIR=folder containing *.onnx + *.json voice pairs

Kyutai proxy (optional, future-ready):
  - If TTS_BACKEND=kyutai and KYUTAI_WS_URL is set, this service will attempt
    to proxy synthesis to a running Kyutai streaming server. For now this path
    returns 503 unless KYUTAI_WS_URL is provided.

Start:
  python tts_proxy.py

This runs on http://localhost:6001 by default.
"""
from __future__ import annotations

import os
import time
import uuid
import logging
from typing import Optional, Dict, Any

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# Reuse existing Piper helpers if available in this repo
try:
    from piper_tts import list_piper_voices, synthesize_with_piper  # type: ignore
except Exception as e:  # pragma: no cover
    list_piper_voices = None  # type: ignore
    synthesize_with_piper = None  # type: ignore

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tts-proxy")

APP_PORT = int(os.environ.get("TTS_PROXY_PORT", "6001"))
DATA_DIR = os.path.join(os.getcwd(), "Data")
os.makedirs(DATA_DIR, exist_ok=True)

TTS_BACKEND = (os.environ.get("TTS_BACKEND") or "piper").strip().lower()

PIPER_PATH = os.environ.get("PIPER_PATH") or "piper"
PIPER_VOICES_DIR = os.environ.get("PIPER_VOICES_DIR") or os.path.join(os.getcwd(), "voices", "piper")
os.makedirs(PIPER_VOICES_DIR, exist_ok=True)

KYUTAI_WS_URL = os.environ.get("KYUTAI_WS_URL")  # e.g. ws://127.0.0.1:8000/tts


def _unique_wav(prefix: str = "speech") -> str:
    return os.path.join(DATA_DIR, f"{prefix}_{uuid.uuid4().hex}.wav")


def _piper_pick_voice(preferred_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if list_piper_voices is None:
        return None
    try:
        voices = list_piper_voices(PIPER_VOICES_DIR) or []
        if not voices:
            return None
        pref = (preferred_id or "").strip()
        for v in voices:
            if v.get("id") == pref or v.get("shortName") == pref:
                return v
        # prefer Hindi then Indian English if present
        for v in voices:
            if str(v.get("locale")).upper() == "HI-IN":
                return v
        for v in voices:
            if str(v.get("locale")).upper() == "EN-IN":
                return v
        return voices[0]
    except Exception:
        return None


def _rate_to_length_scale(rate: Optional[int]) -> Optional[float]:
    """Map UI slider rate (≈50..300) to Piper length_scale (≈0.6..1.6).
    We treat 160 as neutral -> 1.0, faster -> smaller, slower -> larger.
    """
    try:
        if rate is None:
            return None
        r = int(rate)
        if r <= 0:
            return None
        ls = 160.0 / float(r)
        # Clamp within a reasonable range
        if ls < 0.6:
            ls = 0.6
        if ls > 1.6:
            ls = 1.6
        return float(f"{ls:.3f}")
    except Exception:
        return None


def _synthesize_piper(text: str, voice_id: Optional[str], *, length_scale: Optional[float] = None) -> str:
    if synthesize_with_piper is None:
        raise RuntimeError("Piper helpers not available. Ensure piper_tts.py is present in backend.")
    voice = _piper_pick_voice(voice_id)
    if not voice:
        raise RuntimeError(f"No Piper voices found in {PIPER_VOICES_DIR}")
    out_wav = _unique_wav()
    synthesize_with_piper(
        PIPER_PATH,
        voice["paths"]["model"],
        voice["paths"]["config"],
        text,
        out_wav,
        length_scale=length_scale,
    )
    return out_wav


def _synthesize_kyutai(text: str, voice_id: Optional[str]) -> str:
    # Placeholder: implement websocket streaming to an external Kyutai server if URL provided
    if not KYUTAI_WS_URL:
        raise RuntimeError("KYUTAI_WS_URL not set. Start Kyutai server and set KYUTAI_WS_URL to enable.")
    # For now, we return 503 via caller if not configured.
    raise NotImplementedError("Kyutai proxy not implemented in this minimal service.")


def make_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"*": {"origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://cha-cha-chaudari.vercel.app",
    ]}})

    @app.get("/health")
    def health():
        # Report availability
        piper_ok = False
        piper_count = 0
        if list_piper_voices is not None:
            try:
                p = list_piper_voices(PIPER_VOICES_DIR) or []
                piper_count = len(p)
                piper_ok = piper_count > 0
            except Exception:
                piper_ok = False
        return jsonify({
            "status": "ok",
            "backend": TTS_BACKEND,
            "piper": {"path": PIPER_PATH, "voices_dir": PIPER_VOICES_DIR, "available": piper_ok, "count": piper_count},
            "kyutai": {"ws_url": KYUTAI_WS_URL, "configured": bool(KYUTAI_WS_URL)},
        })

    @app.get("/voices")
    def voices():
        if list_piper_voices is None:
            return jsonify({"engine": "piper", "count": 0, "voices": []})
        try:
            v = list_piper_voices(PIPER_VOICES_DIR) or []
            items = []
            for it in v:
                try:
                    items.append({
                        "id": it.get("id") or it.get("shortName"),
                        "shortName": it.get("shortName") or it.get("id"),
                        "locale": it.get("locale") or None,
                    })
                except Exception:
                    continue
            return jsonify({"engine": "piper", "count": len(items), "voices": items})
        except Exception as e:
            return jsonify({"error": "failed to list voices", "details": str(e)}), 500

    def _handle_speak():
        data = request.get_json() or {}
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400
        voice = data.get("voice") or None
        t0 = time.time()
        try:
            if TTS_BACKEND == "piper":
                # Optional rate -> length_scale mapping
                rate_val = data.get("rate")
                try:
                    rate_val = int(rate_val) if rate_val is not None else None
                except Exception:
                    rate_val = None
                ls = _rate_to_length_scale(rate_val)
                out = _synthesize_piper(text, voice, length_scale=ls)
            elif TTS_BACKEND == "kyutai":
                try:
                    out = _synthesize_kyutai(text, voice)
                except NotImplementedError as nie:
                    return jsonify({"error": "kyutai proxy not configured", "details": str(nie)}), 503
            else:
                return jsonify({"error": f"Unsupported backend: {TTS_BACKEND}"}), 400
            dt = int((time.time() - t0) * 1000)
            log.info("/speak synthesized in %d ms via %s", dt, TTS_BACKEND)
            resp = send_file(out, mimetype="audio/wav", as_attachment=False)
            try:
                resp.headers["X-TTS-Backend"] = TTS_BACKEND
            except Exception:
                pass
            return resp
        except Exception as e:
            log.exception("speak failed")
            return jsonify({"error": "synthesis failed", "details": str(e)}), 500

    @app.post("/speak")
    def speak():
        return _handle_speak()

    # Compatibility alias for existing frontend/backend that posts to /tts
    @app.post("/tts")
    def tts():
        return _handle_speak()

    return app


if __name__ == "__main__":
    app = make_app()
    log.info("Starting TTS proxy on port %d (backend=%s)", APP_PORT, TTS_BACKEND)
    app.run(host="0.0.0.0", port=APP_PORT, debug=False)
