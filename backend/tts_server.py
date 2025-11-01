"""
Standalone TTS microservice (Flask) you can run separately from the main backend.

Features
- Piper TTS (offline, fast): requires piper.exe and a voice (.onnx + .json) in voices/piper
- gTTS fallback for Hindi/English if Piper voices aren’t installed
- CORS for localhost and optional FRONTEND_URL (.env or env var)

Run
  powershell:
    cd backend
    $env:FLASK_ENV = "production"
    $env:PORT = "5001"           # optional, default 5001
    python tts_server.py

Frontend
- Set VITE_TTS_BASE_URL to http://localhost:5001 so the UI uses this service for /tts calls.

Env vars (.env or system):
- FRONTEND_URL: comma-separated allowed origins (e.g., http://localhost:5173)
- TTS_ENGINE: piper (default)
- PIPER_PATH: absolute path to piper.exe (e.g., C:\\...\\backend\\piper\\piper.exe)
"""

from __future__ import annotations
import os, time, json, uuid, shutil, subprocess
from typing import Optional, Dict, Any, List
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

try:
    from dotenv import dotenv_values
    ENV = dotenv_values('.env')
except Exception:
    ENV = {}

# Optional Piper helper
try:
    from piper_tts import list_piper_voices, synthesize_with_piper  # type: ignore
except Exception:
    def list_piper_voices(_voices_dir: str) -> List[Dict[str, Any]]:
        return []
    def synthesize_with_piper(*_args, **_kwargs):
        raise RuntimeError('piper_tts helper not available')

APP = Flask(__name__)

frontend_origin = os.environ.get('FRONTEND_URL') or ENV.get('FRONTEND_URL')
if frontend_origin:
    origins = [o.strip() for o in str(frontend_origin).split(',') if o.strip()]
else:
    origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
CORS(APP, origins=origins, allow_headers=["Content-Type", "Authorization"], methods=["GET","POST","OPTIONS"], supports_credentials=True, max_age=86400)

DATA_DIR = os.path.join(os.getcwd(), 'Data')
os.makedirs(DATA_DIR, exist_ok=True)
VOICES_DIR = os.path.join(os.getcwd(), 'voices', 'piper')
os.makedirs(VOICES_DIR, exist_ok=True)

def unique_filename(prefix: str, ext: str) -> str:
    return os.path.join(DATA_DIR, f"{prefix}_{uuid.uuid4().hex}.{ext}")

def _piper_path() -> str:
    val = os.environ.get('PIPER_PATH') or ENV.get('PIPER_PATH') or 'piper'
    if os.path.isabs(val):
        return val
    which = shutil.which(val)
    return which or val

def _get_voices() -> List[Dict[str, Any]]:
    try:
        return list_piper_voices(VOICES_DIR) or []
    except Exception:
        return []

def _pick_default_voice(preferred_id: Optional[str]) -> Optional[Dict[str, Any]]:
    voices = _get_voices()
    if not voices:
        return None
    pref = (preferred_id or '').strip().lower()
    for v in voices:
        vid = (str(v.get('id') or v.get('shortName') or '')).strip().lower()
        if vid == pref:
            return v
    # Prefer hi-IN then en-IN
    for v in voices:
        if str(v.get('locale')).strip().upper() == 'HI-IN':
            return v
    for v in voices:
        if str(v.get('locale')).strip().upper() == 'EN-IN':
            return v
    return voices[0]

def _convert_to_wav_file(src_path: str) -> str:
    if src_path.lower().endswith('.wav'):
        return src_path
    dst = unique_filename('speech', 'wav')
    # Try pydub first
    try:
        from pydub import AudioSegment  # type: ignore
        aud = AudioSegment.from_file(src_path)
        aud.export(dst, format='wav')
        return dst
    except Exception:
        pass
    # Fallback: ffmpeg
    try:
        subprocess.run(['ffmpeg','-y','-i', src_path, dst], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return dst
    except Exception:
        return src_path  # last resort

@APP.route('/health', methods=['GET'])
def health():
    voices = _get_voices()
    return jsonify({
        'service': 'tts-server',
        'tts_engine': 'piper' if voices else 'fallback',
        'piper_path': _piper_path(),
        'voices_count': len(voices),
    })

@APP.route('/voices', methods=['GET'])
def voices_endpoint():
    vs = _get_voices()
    if vs:
        items = []
        for v in vs:
            items.append({
                'id': v.get('id') or v.get('shortName'),
                'shortName': v.get('shortName') or v.get('id'),
                'locale': v.get('locale') or None,
            })
        return jsonify({'count': len(items), 'voices': items, 'engine': 'piper'})
    # Fallback: empty list
    return jsonify({'count': 0, 'voices': [], 'engine': 'none'})

@APP.route('/tts', methods=['POST'])
def tts():
    data = request.get_json() or {}
    text = (data.get('text') or '').strip()
    voice_id = data.get('voice') or None
    lang = (data.get('lang') or '').strip().lower()
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    voices = _get_voices()
    try:
        if voices:
            v = _pick_default_voice(voice_id)
            if not v:
                return jsonify({'error': 'No Piper voice found'}), 500
            out = unique_filename('speech', 'wav')
            synthesize_with_piper(_piper_path(), v['paths']['model'], v['paths']['config'], text, out)
            return send_file(out, mimetype='audio/wav', as_attachment=False)
        # gTTS fallback (en or hi)
        try:
            from gtts import gTTS  # type: ignore
            lang_code = 'hi' if lang.startswith('hi') else 'en'
            mp3_out = unique_filename('speech', 'mp3')
            gTTS(text, lang=lang_code).save(mp3_out)
            wav_out = _convert_to_wav_file(mp3_out)
            return send_file(wav_out, mimetype='audio/wav', as_attachment=False)
        except Exception as e:
            return jsonify({'error': 'TTS fallback failed', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'TTS generation failed', 'details': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT') or ENV.get('PORT') or '5001')
    APP.run(host='0.0.0.0', port=port)
