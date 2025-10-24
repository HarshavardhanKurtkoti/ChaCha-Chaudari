"""
Improved Flask backend for Llama RAG + safe TTS/STT handling
- Uses unique filenames for audio (uuid)
- Saves TTS audio and returns file to client (frontend should play it)
- Removes Selenium-based server STT; provides a simple /stt endpoint that accepts POSTed text from client
- Properly injects RAG context into prompt
- Adds basic error handling and logging
- Notes: frontend should capture microphone (Web Speech API) and POST recognized text to /stt

Harsha / Buddy: this file is a cleaned-up, safer version of your draft.
"""

import os
import time
import sys
import types
import uuid
import logging
import warnings
import struct
from dotenv import dotenv_values
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import numpy as np
import shutil
import subprocess

# Prevent transformers optional stacks and Flask debug reloader
os.environ.setdefault("TRANSFORMERS_NO_AUDIO", "1")
os.environ.setdefault("TRANSFORMERS_NO_TORCHVISION", "1")
os.environ.setdefault("NUMBA_DISABLE_JIT", "1")
os.environ.setdefault("FLASK_ENV", "production")
os.environ.setdefault("FLASK_DEBUG", "0")

# Stub out librosa to avoid importing numba during transformers import path
# We don't use audio features, but transformers imports audio_utils which tries to import librosa.
if "librosa" not in sys.modules:
    import importlib.machinery as _machinery
    _librosa_mod = types.ModuleType("librosa")
    # minimal attributes to satisfy transformers' availability checks
    _librosa_mod.__version__ = "0.0"
    _librosa_mod.__spec__ = _machinery.ModuleSpec(name="librosa", loader=None)
    sys.modules["librosa"] = _librosa_mod

# Stub soxr (optional audio resampler) and soundfile used by transformers.audio_utils
if "soxr" not in sys.modules:
    import importlib.machinery as _machinery
    _soxr_mod = types.ModuleType("soxr")
    _soxr_mod.__version__ = "0.0"
    _soxr_mod.__spec__ = _machinery.ModuleSpec(name="soxr", loader=None)
    sys.modules["soxr"] = _soxr_mod
if "soundfile" not in sys.modules:
    import importlib.machinery as _machinery
    _sf_mod = types.ModuleType("soundfile")
    _sf_mod.__version__ = "0.0"
    _sf_mod.__spec__ = _machinery.ModuleSpec(name="soundfile", loader=None)
    sys.modules["soundfile"] = _sf_mod

import threading

# Load environment variables early (used by TTS config too)
env_vars = dotenv_values('.env')

# Setup logging early so optional imports can safely use `logger`
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Local Piper TTS integration (optional helper module)
try:
    from piper_tts import list_piper_voices, synthesize_with_piper  # type: ignore
    import asyncio
except Exception:
    logger.warning('piper_tts helper not found; falling back to stubs')
    # minimal stubs so module imports succeed; actual piper functionality will be unavailable
    def list_piper_voices(voices_dir: str):
        return []

    def synthesize_with_piper(piper_path: str, model_path: str, config_path: str, text: str, out_wav: str):
        raise RuntimeError('piper_tts not installed; cannot synthesize')

# Piper configuration: path to piper executable and voices directory (contains *.onnx and *.json)
_piper_bin = os.environ.get('PIPER_PATH') or env_vars.get('PIPER_PATH') or 'piper'
# Resolve piper in PATH if a bare command is provided
if not os.path.isabs(_piper_bin):
    which = shutil.which(_piper_bin)
    PIPER_PATH = which or _piper_bin
else:
    PIPER_PATH = _piper_bin
PIPER_VOICES_DIR = os.path.join(os.getcwd(), 'voices', 'piper')
os.makedirs(PIPER_VOICES_DIR, exist_ok=True)

# TTS engine selection: only 'piper' is supported in this repo
TTS_ENGINE = (os.environ.get('TTS_ENGINE') or env_vars.get('TTS_ENGINE') or 'piper').strip().lower()

# Cache Piper voices
_PIPER_CACHE = {"time": 0.0, "list": []}

def get_piper_voices(force_refresh: bool = False):
    now = time.time()
    if not force_refresh and _PIPER_CACHE["list"] and (now - _PIPER_CACHE["time"]) < 300:
        return _PIPER_CACHE["list"]
    voices = list_piper_voices(PIPER_VOICES_DIR)
    _PIPER_CACHE["list"] = voices
    _PIPER_CACHE["time"] = now
    return voices

def pick_indian_piper_voice(preferred_id: str | None) -> dict | None:
    """Pick a Piper voice dict by id or choose an Indian-locale default.
    Preference order: exact id match -> any HI-IN -> any EN-IN -> any available.
    Returns the voice dict or None.
    """
    voices = get_piper_voices()
    if not voices:
        return None
    pref = (preferred_id or '').strip()
    for v in voices:
        if v.get('id') == pref or v.get('shortName') == pref:
            return v
    # prefer Hindi then Indian English
    for v in voices:
        if str(v.get('locale')).upper() == 'HI-IN':
            return v
    for v in voices:
        if str(v.get('locale')).upper() == 'EN-IN':
            return v
    return voices[0]

# Suppress pdfminer warnings
logging.getLogger("pdfminer").setLevel(logging.ERROR)

# Reduce noisy third-party logs unless explicitly overridden
try:
    logging.getLogger("accelerate").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
except Exception:
    pass
import warnings as _pywarnings
_pywarnings.filterwarnings(
    "ignore",
    message=r"`prompt_attention_mask` is specified but `attention_mask` is not\\.",
)

# Suppress noisy torchvision C-extension warning if torchvision gets imported indirectly
warnings.filterwarnings(
    "ignore",
    message="Failed to load image Python extension*",
    category=UserWarning,
)

# RAG utils assumed to be implemented elsewhere (embedder, index, chunks)
try:
    from rag_utils import embedder, index, chunks
except Exception as e:
    logger.error(f"Failed to import rag_utils components: {e}")
    embedder, index, chunks = None, None, None

# DB mode detection for health reporting
try:
    from db import _USING_IN_MEMORY_DB  # type: ignore
except Exception:
    _USING_IN_MEMORY_DB = True

# Transformers / Llama (optional)
try:
    import torch  # noqa: F401
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig  # type: ignore
    _TRANSFORMERS_AVAILABLE = True
except Exception as _tx_err:
    logger.warning(f"Transformers/torch not available, LLM disabled: {_tx_err}")
    AutoTokenizer = AutoModelForCausalLM = BitsAndBytesConfig = None  # type: ignore
    _TRANSFORMERS_AVAILABLE = False


# Local TTS: repository uses Piper-based local TTS only.

# Deprecated: AssistantVoice for edge-tts (kept for compatibility); Piper uses voice id instead
AssistantVoice = env_vars.get('AssistantVoice', '')
InputLanguage = env_vars.get('InputLanguage', 'en')
MODEL_REPO = './Llama-2-7b-chat-hf'

# Ensure Data dir
DATA_DIR = os.path.join(os.getcwd(), 'Data')
os.makedirs(DATA_DIR, exist_ok=True)

# Helper: generate unique filename
def unique_filename(prefix: str, ext: str):
    return os.path.join(DATA_DIR, f"{prefix}_{uuid.uuid4().hex}.{ext}")

def generate_tts_file(text: str, voice_id: str | None = None) -> str:
    """Generate TTS using selected engine. Returns path to a WAV file."""
    # Allow some resilience when TTS_ENGINE is set to an unsupported value
    engine_to_use = TTS_ENGINE
    if engine_to_use != 'piper':
        try:
            # If Piper voices are available on disk, prefer piper even if env differs
            piper_voices = get_piper_voices()
        except Exception:
            piper_voices = []
        if piper_voices:
            logger.info(f"TTS_ENGINE='{TTS_ENGINE}' but Piper voices found; using 'piper' engine instead")
            engine_to_use = 'piper'
        else:
            logger.info(f"TTS_ENGINE '{TTS_ENGINE}' not supported and no Piper voices found — falling back to local-basic")
            # Use local basic TTS as a fallback
            out_wav = unique_filename('speech', 'wav')
            try:
                # Import local-basic helper lazily to avoid import-order issues
                try:
                    from edge_local_tts_stt import tts_local_basic
                except Exception:
                    raise RuntimeError('local-basic TTS helper not available')
                tts_local_basic(text, out_path=out_wav, voice=voice_id)
                return out_wav
            except Exception as e:
                logger.exception('local-basic fallback failed')
                raise RuntimeError('No available TTS engine to synthesize audio') from e

    # Now handle piper engine
    if engine_to_use == 'piper':
        voice = pick_indian_piper_voice(voice_id)
        if not voice:
            raise RuntimeError('No Piper voices found. Place voices in ' + PIPER_VOICES_DIR)
        model_path = voice['paths']['model']
        config_path = voice['paths']['config']
        out_wav = unique_filename('speech', 'wav')
        synthesize_with_piper(PIPER_PATH, model_path, config_path, text, out_wav)
        return out_wav
    # Should not reach here
    raise RuntimeError('Failed to select TTS engine')


def _safe_send_file(out_path: str, mimetype: str, engine_label: str, voice_id: str | None = None):
    """Send a generated audio file only if it exists and is non-empty.
    Returns a Flask response (file or JSON error).
    Adds diagnostic headers including generated file size and engine used.
    """
    try:
        if not out_path or not os.path.exists(out_path):
            logger.error('TTS produced no file: %r', out_path)
            return jsonify({'error': 'TTS produced no file', 'path': out_path}), 500
        size = 0
        try:
            size = os.path.getsize(out_path)
        except Exception:
            size = 0
        if size == 0:
            logger.error('TTS produced empty file: %r', out_path)
            # Try to provide a friendly fallback sample if available
            sample = os.path.join(os.getcwd(), 'frontend', 'public', 'assets', 'chacha-cahaudhary', 'Greeting.wav')
            if os.path.exists(sample):
                resp = send_file(sample, mimetype='audio/wav', as_attachment=False)
                try:
                    resp.headers['X-TTS-Engine'] = engine_label
                    resp.headers['X-TTS-Fallback'] = 'sample-greeting'
                    resp.headers['X-Generated-File-Size'] = str(size)
                except Exception:
                    pass
                return resp
            return jsonify({'error': 'TTS produced empty file', 'path': out_path}), 500
        # If file is suspiciously small, return the same friendly fallback so clients don't get 0:00
        if size < 2000:
            logger.warning('TTS produced very small file (%d bytes): %r — returning bundled sample fallback', size, out_path)
            sample = os.path.join(os.getcwd(), 'frontend', 'public', 'assets', 'chacha-cahaudhary', 'Greeting.wav')
            if os.path.exists(sample):
                resp = send_file(sample, mimetype='audio/wav', as_attachment=False)
                try:
                    resp.headers['X-TTS-Engine'] = engine_label
                    resp.headers['X-TTS-Fallback'] = 'sample-greeting'
                    resp.headers['X-Generated-File-Size'] = str(size)
                except Exception:
                    pass
                return resp
            # no sample fallback available; return error to avoid handing tiny header-only audio
            return jsonify({'error': 'TTS produced too-small audio', 'path': out_path, 'size': size}), 500
        resp = send_file(out_path, mimetype=mimetype, as_attachment=False)
        try:
            if voice_id is not None:
                resp.headers['X-Voice-Used'] = (voice_id or '')
            resp.headers['X-TTS-Engine'] = engine_label
            resp.headers['X-Generated-File-Size'] = str(size)
        except Exception:
            pass
        return resp
    except Exception as e:
        logger.exception('Failed to send generated audio')
        return jsonify({'error': 'failed to send audio', 'details': str(e)}), 500

# Simple WAV header helper (if needed)
def convert_to_wav_headered(audio_data: bytes, bits_per_sample: int = 16, rate: int = 24000) -> bytes:
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = rate * block_align
    chunk_size = 36 + data_size
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        chunk_size,
        b'WAVE',
        b'fmt ',
        16,
        1,
        num_channels,
        rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b'data',
        data_size,
    )
    return header + audio_data


def convert_to_wav_file(src_path: str) -> str:
    """Ensure the given audio file is a WAV file. If not, convert it to WAV.
    Tries pydub first (if available), otherwise falls back to ffmpeg CLI.
    Returns the path to the WAV file (may be the original if already WAV).
    """
    try:
        if not src_path or not os.path.exists(src_path):
            raise FileNotFoundError(f"Source audio not found: {src_path}")
        if src_path.lower().endswith('.wav'):
            return src_path
        dst = unique_filename('speech', 'wav')
        # Try pydub first
        try:
            from pydub import AudioSegment  # type: ignore
            aud = AudioSegment.from_file(src_path)
            aud.export(dst, format='wav')
            logger.info('Converted %s to WAV via pydub -> %s', src_path, dst)
            return dst
        except Exception:
            logger.info('pydub convert to WAV failed; trying ffmpeg CLI')
        # Fallback: use ffmpeg CLI
        try:
            cmd = ['ffmpeg', '-y', '-i', src_path, dst]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info('Converted %s to WAV via ffmpeg -> %s', src_path, dst)
            return dst
        except Exception as e:
            logger.exception('ffmpeg conversion failed')
            raise RuntimeError('Failed to convert audio to WAV') from e
    except Exception:
        logger.exception('convert_to_wav_file failed')
        raise

"""Model initialization with conservative defaults.
We avoid unnecessary memory pressure on CPU-only machines by:
- keeping context small and
- using smaller max_new_tokens by default (overridable via env vars)
"""

# Load tokenizer + model (with bitsandbytes config if available)
tokenizer = None
llm = None
_LLM_DEVICE = "cpu"
logger.info('Initializing LLM (optional)...')
# Allow skipping heavy LLM load during dev/run by setting SKIP_LLM_LOAD=1
if os.environ.get('SKIP_LLM_LOAD', env_vars.get('SKIP_LLM_LOAD', '')).strip() not in ('1', 'true', 'yes'):
    try:
        if _TRANSFORMERS_AVAILABLE:
            # Decide whether we should restrict to local-only model loads.
            local_only_flag = (os.environ.get('MODEL_REPO_LOCAL_ONLY') or env_vars.get('MODEL_REPO_LOCAL_ONLY') or '').strip().lower()
            model_repo_local_only = local_only_flag in ('1', 'true', 'yes')

            repo_path = None
            try:
                # If MODEL_REPO looks like a filesystem path, prefer local folder when available
                if isinstance(MODEL_REPO, str) and (MODEL_REPO.startswith('.') or os.path.isabs(MODEL_REPO) or os.path.sep in MODEL_REPO):
                    candidate = os.path.abspath(MODEL_REPO)
                    if os.path.isdir(candidate):
                        repo_path = candidate
            except Exception:
                repo_path = None

            try:
                if repo_path:
                    logger.info(f"Attempting to load LLM from local path '{repo_path}'")
                    tokenizer = AutoTokenizer.from_pretrained(repo_path, use_fast=True, local_files_only=True)
                    llm = AutoModelForCausalLM.from_pretrained(repo_path, device_map='auto', trust_remote_code=True, local_files_only=True)
                else:
                    if model_repo_local_only:
                        logger.info(f"MODEL_REPO_LOCAL_ONLY set and local path '{MODEL_REPO}' not found; skipping LLM load")
                    else:
                        logger.info(f"Attempting to load LLM from '{MODEL_REPO}' (network fetch allowed). Set MODEL_REPO_LOCAL_ONLY=1 to avoid network fetches.")
                        tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, use_fast=True)
                        llm = AutoModelForCausalLM.from_pretrained(MODEL_REPO, device_map='auto', trust_remote_code=True)

                if llm is not None:
                    try:
                        import torch as _torch  # type: ignore
                        _LLM_DEVICE = next(llm.parameters()).device.type  # cuda or cpu
                    except Exception:
                        _LLM_DEVICE = "cpu"
                    logger.info(f'LLM loaded on {_LLM_DEVICE}')
            except Exception:
                logger.exception('Failed to load LLM; continuing without LLM')
        else:
            logger.info('LLM skipped (transformers/torch not available)')
    except Exception:
        logger.exception('Failed to load LLM')
        tokenizer, llm = None, None
else:
    logger.info('SKIP_LLM_LOAD set — skipping LLM initialization')

# ---------------------------
# TTS preload and readiness
# ---------------------------
def _tts_ready() -> bool:
    """Report whether the configured TTS engine is ready to serve quickly."""
    try:
        # Piper: ready if at least one voice is discoverable
        return len(get_piper_voices()) > 0
    except Exception:
        return False

def _preload_tts_sync():
    """Preload the selected TTS engine so first request is fast."""
    try:
        logger.info(f"Preloading TTS engine '{TTS_ENGINE}'...")
        # Piper: scan voices once to populate cache
        _ = get_piper_voices(force_refresh=True)
        if _:
            logger.info(f"Piper TTS voices available: {len(_)}")
        else:
            logger.info('Piper TTS preload found no voices')
    except Exception:
        logger.exception('TTS preload encountered an error')

def _preload_tts_async():
    try:
        th = threading.Thread(target=_preload_tts_sync, name='tts-preload', daemon=True)
        th.start()
    except Exception:
        logger.exception('Failed to start TTS preload thread')

# ---------------------------
# Fallback story builders
# ---------------------------
def _conversational_fallback(topic: str, name: str | None, age_group: str | None, history: list[dict] | None) -> str:
    """Heuristic, natural-sounding fallback when LLM isn't available.
    - Warmer tone, short and human.
    - References known topics with a one-line follow-up question.
    - Uses recent context lightly (last user message) if present.
    """
    t = (topic or "").strip()
    nm = (name or "friend").strip()
    ag = (age_group or "").strip().lower() or None
    lt = t.lower()
    # Last user message if any
    last_user = None
    try:
        if history:
            for m in reversed(history[-6:]):
                if str(m.get('role')) in ('user', 'User'):
                    last_user = str(m.get('content') or '').strip()
                    break
    except Exception:
        pass

    # Greeting intents
    greetings = {"hi", "hello", "hey", "yo", "hola", "namaste", "hi!", "hello!", "hey!"}
    if lt in greetings or any(lt.startswith(g+" ") for g in greetings):
        opener = f"Hey {nm}!" if name else "Hey there!"
        return (
            f"{opener} I’m ChaCha. Great to see you. "
            f"What should we explore today — the Ganga, Namami Gange, or something else you’re curious about?"
        )

    if "namami gange" in lt or "namami ganga" in lt:
        core = (
            "Namami Gange is India’s mission to clean and protect the Ganga — building sewage treatment, reducing pollution, restoring habitats, and involving people."
        )
        follow = "Want a quick example from a real city project?"
        return f"{f'Hi {nm}, ' if name else ''}{core} {follow}"

    if "river ganga" in lt or "ganga river" in lt or "ganges" in lt:
        core = (
            "The Ganga is a lifeline for millions — sacred to many, vital for farms and cities, and home to unique wildlife like the Ganges river dolphin."
        )
        follow = "Should we talk about wildlife, culture, or how the river is kept healthy?"
        return f"{f'Hi {nm}, ' if name else ''}{core} {follow}"

    # Generic, topic-aware fallback with a hint of continuity
    if last_user and last_user != t and len(last_user) > 3:
        continuity = f"You mentioned earlier: '{last_user}'. "
    else:
        continuity = ""
    follow = "Does that help, or should I go deeper with a short example?"
    # Slightly simpler phrasing for kids
    if ag == 'kid':
        return (
            f"Hi {nm}, here’s the idea about {t} in simple words you can follow. "
            f"{continuity}I’ll keep it short and friendly so it’s easy to remember. {follow}"
        )
    return (
        f"Here’s the gist of {t}: clear and to the point. {continuity}{follow}"
    )

def _teen_short_about(topic: str) -> str:
    lt = (topic or "").lower()
    if "namami gange" in lt or "namami ganga" in lt:
        return (
            "Namami Gange is India’s national mission (launched 2014) to clean and rejuvenate the Ganga: "
            "sewage treatment plants, river-surface cleaning, industrial effluent control, biodiversity, afforestation, and public participation. "
            "Goal: sustained reduction in pollution and a healthier river ecosystem."
        )
    return (
        f"Here’s the gist of {topic}: key ideas explained clearly in a few lines, with causes, effects, and one practical example."
    )

def _adult_short_about(topic: str) -> str:
    lt = (topic or "").lower()
    if "namami gange" in lt or "namami ganga" in lt:
        return (
            "Namami Gange (2014–) is GoI’s flagship river rejuvenation programme: "
            "pillars include sewage infrastructure, industrial discharge control, riverfront development, biodiversity conservation, afforestation, and public engagement."
        )
    return (
        f"Summary of {topic}: concise definition, 2–3 pillars, and intended outcomes."
    )

def create_app():
    app = Flask(__name__)

    # CORS configuration (allow frontend origin if provided)
    frontend_origin = env_vars.get('FRONTEND_URL')
    cors_kwargs = dict(
        origins=[frontend_origin] if frontend_origin else "*",
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS"],
        max_age=86400,
        supports_credentials=True,
    )
    CORS(app, **cors_kwargs)

    # Register blueprints (auth, chats)
    try:
        # Import as local modules since app.py runs from /workspace/backend
        from auth import auth_bp
        from chat_routes import chat_bp
        app.register_blueprint(auth_bp)
        app.register_blueprint(chat_bp)
    except Exception as e:
        logger.warning(f"Blueprint registration failed (possibly during import stage): {e}")

    # Legacy endpoints kept below

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'service': 'SmartGanga Mascot Backend',
            'endpoints': ['/health', '/tts (POST)', '/stt (POST)', '/llama-chat (POST)']
        })

    @app.route('/tts', methods=['POST'])
    def tts_endpoint():
        """Accepts JSON {"text": "..."} and returns an mp3 file to play on client-side.
        NOTE: The file is generated with a unique name to avoid concurrency issues."""
        data = request.get_json() or {}
        text = data.get('text')
        voice_id = data.get('voice') or None
        description = data.get('description') or data.get('caption') or None
        logger.info(f"/tts request received. voice_id={voice_id!r} desc_present={bool(description)}")
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        try:
            # Allow clients to request a language or locale hint
            lang = (data.get('lang') or data.get('locale') or '').strip()
            # Optionally accept an explicit playback rate (pyttsx3 absolute rate)
            rate = data.get('rate')
            try:
                rate = int(rate) if rate is not None else None
            except Exception:
                rate = None
            style = (data.get('style') or '').strip()
            seed = data.get('seed')
            try:
                seed = int(seed) if seed is not None else None
            except Exception:
                seed = None
            # If language provided and no explicit description, craft a short directive
            if lang and not description:
                l = lang.lower()
                # Basic mapping for common cases; description can control speaker/style for some engines
                lang_map = {
                    'hi': 'Speak in Hindi with a neutral Indian accent.',
                    'hi-in': 'Speak in Hindi with a neutral Indian accent.',
                    'en': 'Speak in English with an Indian English accent.',
                    'en-in': 'Speak in English with an Indian English accent.',
                }
                base = lang_map.get(l, f"Speak in language: {lang}.")
                if style:
                    description = f"{base} Style: {style}."
                else:
                    description = base

            # Route to engine-specific generator (prefer offline local-basic for English)
            tts_start = time.time()
            use_fast = _EDGE_LOCAL_AVAILABLE and _is_english_hint(lang)
            # Avoid calling fast helper when voice_id looks engine-specific
            if voice_id:
                vlow = str(voice_id).strip().lower()
                if vlow.startswith('piper'):
                    logger.info(f"Skipping fast-tts because voice_id '{voice_id}' appears to be engine-specific")
                    use_fast = False
            if use_fast:
                try:
                    # Use offline local basic engine and return WAV
                    out_path = tts_local_basic(text, voice=voice_id, rate=rate)
                    mimetype = 'audio/wav'
                    logger.info(f"Fast local-basic TTS used for lang={lang}, out={out_path}")
                    # If the produced file is suspiciously small (pyttsx3 sometimes
                    # creates a header-only WAV on some Windows setups), try a
                    # quick gTTS fallback instead of returning an empty-sounding file.
                    try:
                        size = os.path.getsize(out_path) if out_path and os.path.exists(out_path) else 0
                    except Exception:
                        size = 0
                    if size < 2000:
                        logger.warning('local-basic produced small file (%d bytes); attempting gTTS fallback', size)
                        try:
                            from gtts import gTTS  # type: ignore
                            fb_out = unique_filename('speech', 'mp3')
                            tts_obj = gTTS(text, lang='hi' if (lang or '').lower().startswith('hi') else 'en')
                            tts_obj.save(fb_out)
                            logger.info('gTTS fallback produced %s', fb_out)
                            try:
                                wav_fb = convert_to_wav_file(fb_out)
                                return _safe_send_file(wav_fb, 'audio/wav', 'gtts', voice_id)
                            except Exception:
                                # if conversion fails, still attempt to return original mp3
                                return _safe_send_file(fb_out, 'audio/mpeg', 'gtts', voice_id)
                        except Exception:
                            logger.exception('gTTS fallback failed after small local-basic file; trying edge-tts fallback')
                            # Try edge-tts fallback if available (edge_local_tts_stt.tts_edge_sync)
                            try:
                                from edge_local_tts_stt import tts_edge_sync  # type: ignore
                                fb_out = unique_filename('speech', 'mp3')
                                tts_edge_sync(text, out_path=fb_out, voice=voice_id)
                                logger.info('edge-tts fallback produced %s', fb_out)
                                try:
                                    wav_fb2 = convert_to_wav_file(fb_out)
                                    return _safe_send_file(wav_fb2, 'audio/wav', 'edge-tts', voice_id)
                                except Exception:
                                    return _safe_send_file(fb_out, 'audio/mpeg', 'edge-tts', voice_id)
                            except Exception:
                                logger.exception('edge-tts fallback also failed; returning original local-basic output')
                    return _safe_send_file(out_path, mimetype, 'local-basic', voice_id)
                except Exception as e:
                    logger.exception('fast local-basic TTS failed; falling back to configured engine')
            # If the requested language is Hindi and Piper/local voices are not available,
            # try a quick online fallback using gTTS (Google TTS) which supports Hindi.
            # This keeps the UX working when local Piper voices are not installed.
            lhl = (lang or '').strip().lower()
            if lhl.startswith('hi'):
                try:
                    # Lazy import so gTTS isn't required unless we need it
                    from gtts import gTTS  # type: ignore
                    out_path = unique_filename('speech', 'mp3')
                    tts_obj = gTTS(text, lang='hi')
                    tts_obj.save(out_path)
                    # If caller requested a male-sounding voice, attempt a simple
                    # pitch-lowering post-process to make the voice deeper. This is
                    # a lightweight heuristic (not a true male voice) and requires
                    # pydub + ffmpeg available on the host. We try it if the client
                    # requested gender:'male' or voice string includes 'male'.
                    want_male = False
                    try:
                        req_gender = (data.get('gender') or data.get('sex') or '').strip().lower()
                        if req_gender == 'male':
                            want_male = True
                    except Exception:
                        want_male = False
                    try:
                        if not want_male and voice_id and 'male' in str(voice_id).lower():
                            want_male = True
                    except Exception:
                        pass
                    if want_male:
                        try:
                            from pydub import AudioSegment  # type: ignore
                            # Load generated mp3
                            aud = AudioSegment.from_file(out_path, format='mp3')
                            # Lower pitch by reducing frame rate then resampling back
                            # Factor 0.85 gives a modest deeper voice; tweakable.
                            factor = 0.85
                            new_rate = int(aud.frame_rate * factor)
                            deeper = aud._spawn(aud.raw_data, overrides={'frame_rate': new_rate})
                            deeper = deeper.set_frame_rate(aud.frame_rate)
                            # Overwrite same path as mp3
                            deeper.export(out_path, format='mp3')
                            logger.info('Applied pydub pitch-lowering to approximate male voice')
                        except Exception:
                            logger.exception('Failed to apply pitch-lowering postprocess; returning original gTTS audio')
                    logger.info('Used gTTS fallback for Hindi synthesis (out=%s)', out_path)
                    try:
                        wav_path = convert_to_wav_file(out_path)
                        return _safe_send_file(wav_path, 'audio/wav', 'gtts', voice_id)
                    except Exception:
                        return _safe_send_file(out_path, 'audio/mpeg', 'gtts', voice_id)
                except Exception:
                    logger.exception('gTTS fallback for Hindi failed; trying edge-tts fallback')
                    try:
                        from edge_local_tts_stt import tts_edge_sync  # type: ignore
                        fb_out = unique_filename('speech', 'mp3')
                        tts_edge_sync(text, out_path=fb_out, voice=voice_id)
                        logger.info('edge-tts fallback produced %s', fb_out)
                        try:
                            wav_fb = convert_to_wav_file(fb_out)
                            return _safe_send_file(wav_fb, 'audio/wav', 'edge-tts', voice_id)
                        except Exception:
                            return _safe_send_file(fb_out, 'audio/mpeg', 'edge-tts', voice_id)
                    except Exception:
                        logger.exception('edge-tts fallback for Hindi also failed; returning bundled sample if available')
                        sample = os.path.join(os.getcwd(), 'frontend', 'public', 'assets', 'chacha-cahaudhary', 'Greeting.wav')
                        if os.path.exists(sample):
                            resp = send_file(sample, mimetype='audio/wav', as_attachment=False)
                            try:
                                resp.headers['X-TTS-Engine'] = 'none'
                                resp.headers['X-TTS-Fallback'] = 'sample-greeting'
                                resp.headers['X-Generated-File-Size'] = '0'
                            except Exception:
                                pass
                            return resp
            # fallback to heavy engines
            out_path = generate_tts_file(text, voice_id=voice_id)
            tts_latency_ms = int((time.time() - tts_start) * 1000)
            logger.info(f"TTS generation finished in {tts_latency_ms}ms (engine={TTS_ENGINE}, voice={voice_id}, lang={lang})")
            # Piper produces WAV
            mimetype = 'audio/wav'
            logger.info('Returning generated TTS file: %s', out_path)
            return _safe_send_file(out_path, mimetype, TTS_ENGINE, voice_id)
        except Exception as e:
            logger.exception('TTS endpoint error')
            return jsonify({'error': 'TTS generation failed', 'details': str(e)}), 500

    # Lightweight local TTS/STT helpers (fast, offline where possible)
    try:
        from edge_local_tts_stt import tts_edge_sync, speech_recognition_once, tts_local_basic, list_local_basic_voices
        _EDGE_LOCAL_AVAILABLE = True
    except Exception:
        _EDGE_LOCAL_AVAILABLE = False

    def _is_english_hint(lang_hint: str | None) -> bool:
        """Return True if lang_hint or configured InputLanguage indicates English."""
        try:
            lh = (lang_hint or '').strip().lower()
            if lh:
                return lh.startswith('en')
            cfg = (env_vars.get('InputLanguage') or os.environ.get('InputLanguage') or '').strip().lower()
            return cfg.startswith('en')
        except Exception:
            return False

    @app.route('/fast-tts', methods=['POST'])
    def fast_tts():
        # Prefer fully offline local-basic TTS (pyttsx3) and return WAV
        if not _EDGE_LOCAL_AVAILABLE:
            return jsonify({'error': 'fast-tts helper not available'}), 503
        data = request.get_json() or {}
        text = data.get('text')
        voice = data.get('voice') or None
        rate = data.get('rate')
        try:
            rate = int(rate) if rate is not None else None
        except Exception:
            rate = None
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        try:
            # Always use offline local-basic here
            out = tts_local_basic(text, out_path=None, voice=voice, rate=rate)
            logger.info('fast-tts produced file: %s', out)
            try:
                size = os.path.getsize(out) if out and os.path.exists(out) else 0
            except Exception:
                size = 0
            if size < 2000:
                logger.warning('fast-tts produced small file (%d bytes); attempting gTTS fallback', size)
    
                try:
                    from gtts import gTTS  # type: ignore
                    fb_out = unique_filename('speech', 'mp3')
                    tts_obj = gTTS(text, lang='en' if not (voice or '').lower().startswith('hi') else 'hi')
                    tts_obj.save(fb_out)
                    try:
                        wav_fb = convert_to_wav_file(fb_out)
                        return _safe_send_file(wav_fb, 'audio/wav', 'gtts', voice)
                    except Exception:
                        return _safe_send_file(fb_out, 'audio/mpeg', 'gtts', voice)
                except Exception:
                    logger.exception('gTTS fallback failed for fast-tts; trying edge-tts fallback')
                    try:
                        from edge_local_tts_stt import tts_edge_sync  # type: ignore
                        fb_out = unique_filename('speech', 'mp3')
                        tts_edge_sync(text, out_path=fb_out, voice=voice)
                        try:
                            wav_fb_e = convert_to_wav_file(fb_out)
                            return _safe_send_file(wav_fb_e, 'audio/wav', 'edge-tts', voice)
                        except Exception:
                            return _safe_send_file(fb_out, 'audio/mpeg', 'edge-tts', voice)
                    except Exception:
                        logger.exception('edge-tts fallback failed for fast-tts; returning original')
            return _safe_send_file(out, 'audio/wav', 'local-basic', voice)
        except Exception as e:
            logger.exception('fast-tts failed')
            return jsonify({'error': 'fast-tts failed', 'details': str(e)}), 500

    @app.route('/fast-stt', methods=['GET'])
    def fast_stt():
        if not _EDGE_LOCAL_AVAILABLE:
            return jsonify({'error': 'fast-stt helper not available'}), 503
        try:
            text = speech_recognition_once()
            return jsonify({'result': text})
        except Exception as e:
            logger.exception('fast-stt failed')
            return jsonify({'error': 'fast-stt failed', 'details': str(e)}), 500

    @app.route('/voices', methods=['GET'])
    def voices_endpoint():
        try:
            # Prefer returning Piper voices when available (these are the voices
            # used by the main TTS engine). If no Piper voices are found, fall
            # back to local OS voices via pyttsx3 so the frontend still has
            # something to show.
            piper_list = []
            try:
                piper_list = get_piper_voices() or []
            except Exception:
                piper_list = []
            if piper_list:
                # Normalize to { id, shortName, locale }
                items = []
                for v in piper_list:
                    try:
                        items.append({
                            'id': v.get('id') or v.get('shortName'),
                            'shortName': v.get('shortName') or v.get('id'),
                            'locale': v.get('locale') or None,
                        })
                    except Exception:
                        continue
                return jsonify({ 'count': len(items), 'voices': items, 'engine': 'piper' })
            # Fallback: return local system voices
            items = list_local_basic_voices()
            return jsonify({ 'count': len(items), 'voices': items, 'engine': 'local-basic' })
        except Exception as e:
            return jsonify({ 'error': 'failed to list voices', 'details': str(e) }), 500

    @app.route('/tts-diagnostic', methods=['GET'])
    def tts_diagnostic():
        """Return diagnostics about TTS availability and configured Piper path.
        Helps debug why Piper voices may be missing or why synthesize_with_piper is unavailable.
        """
        try:
            info = {
                'piper_helper_imported': False,
                'piper_path': PIPER_PATH,
                'piper_voices_dir': PIPER_VOICES_DIR,
                'piper_voices_count': 0,
                'piper_voices_sample': [],
            }
            # If piper helper is available, get cached voices
            try:
                voices = get_piper_voices(force_refresh=True) or []
                info['piper_helper_imported'] = True
                info['piper_voices_count'] = len(voices)
                # include up to 8 sample entries (id, shortName, locale)
                info['piper_voices_sample'] = [ { 'id': v.get('id'), 'shortName': v.get('shortName'), 'locale': v.get('locale') } for v in voices[:8] ]
            except Exception as e:
                info['piper_helper_imported'] = False
                info['piper_error'] = str(e)
            # Check for optional audio post-processing availability (pydub + ffmpeg)
            try:
                from pydub import AudioSegment  # type: ignore
                info['pydub_available'] = True
                # Try to detect ffmpeg by attempting to call AudioSegment.converter
                try:
                    ff = AudioSegment.converter
                    info['ffmpeg_path'] = ff
                    info['ffmpeg_available'] = bool(ff and os.path.exists(ff))
                except Exception:
                    info['ffmpeg_path'] = None
                    info['ffmpeg_available'] = False
            except Exception as e:
                info['pydub_available'] = False
                info['pydub_error'] = str(e)
            # Check whether PIPER_PATH points to an executable file
            try:
                info['piper_path_exists'] = os.path.isabs(PIPER_PATH) and os.path.exists(PIPER_PATH)
            except Exception:
                info['piper_path_exists'] = False
            return jsonify(info)
        except Exception as e:
            return jsonify({'error': 'diagnostic failed', 'details': str(e)}), 500

    # Serve generated audio files saved under Data/
    @app.route('/generated_audio/<path:filename>', methods=['GET'])
    def get_generated_audio(filename: str):
        try:
            path = os.path.join(DATA_DIR, filename)
            if not os.path.isfile(path):
                return jsonify({'error': 'file not found'}), 404
            # Default to WAV for local-basic; clients should handle audio/wav
            return send_file(path, mimetype='audio/wav', as_attachment=False)
        except Exception as e:
            return jsonify({'error': 'failed to serve audio', 'details': str(e)}), 500

    @app.route('/stt', methods=['POST'])
    def stt_endpoint():
        data = request.get_json() or {}
        text = data.get('text')
        # If no text provided and fast STT is available and configured English, run live speech capture
        if not text:
            if _EDGE_LOCAL_AVAILABLE and _is_english_hint(None):
                try:
                    captured = speech_recognition_once()
                    return jsonify({'result': captured})
                except Exception as e:
                    logger.exception('fast-stt capture failed')
                    return jsonify({'error': 'fast-stt failed', 'details': str(e)}), 500
            return jsonify({'error': 'No text provided'}), 400
        return jsonify({'result': text})

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'ok',
            'rag_ready': embedder is not None and index is not None and chunks is not None,
            'llm_ready': tokenizer is not None and llm is not None,
            'llm_device': _LLM_DEVICE,
            'tts_engine': TTS_ENGINE,
            'tts_ready': _tts_ready(),
            'tts_device': None,
            'db_mode': 'memory' if _USING_IN_MEMORY_DB else 'mongo'
        })

    @app.route('/llama-chat', methods=['GET', 'POST', 'OPTIONS'])
    def llama_chat():
        req_start = time.time()
        logging.debug("Request received at /llama-chat")
        if request.method == 'OPTIONS':
            # Fast CORS preflight response
            return ("", 200)
        if request.method == 'GET':
            return jsonify({
                'error': 'Use POST with JSON payload {"prompt": "..."}',
                'example': {'prompt': 'Hello'}
            }), 405
        if embedder is None or index is None or chunks is None:
            # Allow running in fallback-only mode when RAG data/components are not present.
            allow_fallback_without_rag = os.environ.get('LLAMA_ALLOW_FALLBACK_WITHOUT_RAG', '')
            if allow_fallback_without_rag.strip().lower() in ('1', 'true', 'yes'):
                logger.info('RAG components not initialized but LLAMA_ALLOW_FALLBACK_WITHOUT_RAG set — proceeding in fallback-only mode')
            else:
                return jsonify({"error": "RAG components not initialized"}), 503
        # If model is missing but we can still respond, use fallback
        model_missing = tokenizer is None or llm is None
        try:
            data = request.get_json() or {}
            prompt = data.get("prompt")
            # Optional fast/fallback flag from client to bypass LLM entirely
            force_fallback = False
            fb_req = data.get('fallback')
            if isinstance(fb_req, bool):
                force_fallback = fb_req
            elif isinstance(fb_req, str):
                force_fallback = fb_req.strip().lower() in ("1", "true", "yes")
            # Or via environment variable
            if os.environ.get('LLAMA_FORCE_FALLBACK', '').lower() in ("1", "true", "yes"):
                force_fallback = True
            # Optional personalization info: ageGroup, or explicit age/name
            # Accept a few common variants to be robust to clients
            age_group = (
                data.get('ageGroup')
                or data.get('agegroup')
                or data.get('age_group')
                or data.get('AgeGroup')
            )
            user_name = (
                data.get('name')
                or data.get('Name')
                or data.get('username')
                or data.get('user_name')
            )
            if isinstance(age_group, str):
                age_group = age_group.strip().lower()
                if age_group in ('child', 'children', 'kids', 'kiddo'):
                    age_group = 'kid'
            if isinstance(user_name, str):
                user_name = user_name.strip()
            # If Authorization header carries a Bearer token, only use it to backfill missing name/age
            if not user_name or not age_group:
                try:
                    from auth import SECRET_KEY
                    auth_header = request.headers.get('Authorization')
                    if auth_header and auth_header.startswith('Bearer '):
                        import jwt
                        tok = auth_header.split(' ', 1)[1]
                        claims = jwt.decode(tok, SECRET_KEY, algorithms=['HS256'])
                        if not user_name:
                            user_name = claims.get('name')
                        if not age_group:
                            age_claim = claims.get('age')
                            if isinstance(age_claim, int):
                                # Treat ages < 12 as 'kid', < 16 as 'teen', else 'adult'
                                age_group = 'kid' if age_claim < 12 else 'teen' if age_claim < 16 else 'adult'
                except Exception:
                    pass
            if not prompt:
                return jsonify({"error": "No prompt provided"}), 400

            logging.debug(f"Prompt received: {prompt}")
            # Accept recent conversational history from client
            history = data.get('history')
            if not isinstance(history, list):
                history = []
            # Trim to last few messages
            history = history[-8:]

            # Lightweight intent: special-case simple greetings
            simple = (prompt or '').strip().lower()
            if simple in ("hi", "hello", "hey", "yo", "hola", "namaste"):
                # For kids, expand the fallback to a multi-paragraph mini story with an outcome
                base = _conversational_fallback(prompt, user_name, age_group, history)
                if (age_group or '').strip().lower() == 'kid':
                    try:
                        topic = (prompt or '').strip()
                        name = (user_name or 'friend').strip()
                        para1 = (
                            f"Imagine {name} and I visit a small riverside town. The riverbank is bare, and after each rain the soil slides into the water, making it brown and gloomy."
                        )
                        para2 = (
                            f"We talk with neighbors about {topic}. Together we plant native saplings, add simple fences to protect young trees, and place bins so wind can’t carry trash into the river."
                        )
                        para3 = (
                            f"Weeks later, the roots hold the soil, the water turns clearer, and tiny fish return. Children spot a kingfisher diving — a sign the river is healing."
                        )
                        moral = (
                            f"That’s how {topic} works in real life — small steps, done together, create a big, happy change. Would you like to imagine what we can do next at your river?"
                        )
                        result = f"{base}\n\n{para1}\n\n{para2}\n\n{para3}\n\n{moral}"
                    except Exception:
                        result = base
                else:
                    result = base
                latency_ms = int((time.time() - req_start) * 1000)
                return jsonify({
                    "result": result,
                    "retrieved_count": 0,
                    "temperature": 0.0,
                    "top_p": 1.0,
                    "used_max_new_tokens": 0,
                    "latency_ms": latency_ms,
                    "wants_long": False,
                })
            # 1) Retrieve context (cheap)
            query_emb = embedder.encode([prompt])
            # ensure numpy array with shape (1, D)
            query_arr = np.array(query_emb, dtype=np.float32)
            if query_arr.ndim == 1:
                query_arr = np.expand_dims(query_arr, 0)
            D, I = index.search(query_arr, k=3)
            retrieved_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
            context = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else ""

            # Hard cap context size to avoid excessive input length
            max_context_chars = int(os.environ.get("RAG_CONTEXT_CHARS", "1200"))
            if len(context) > max_context_chars:
                context = context[:max_context_chars] + "\n[context truncated]"

            # Build an age-adaptive system preface
            persona_lines = []
            if user_name:
                persona_lines.append(f"The user's name is {user_name}.")
            # Natural, human-style guidance by age
            persona_lines.append("Speak as ChaCha in first person (I/me), natural and warm, like a real human conversation.")
            if age_group == 'kid':
                persona_lines.append("Use simple, positive language and create a longer explanation with a short story example.")
                persona_lines.append("Structure: briefly explain the idea, then tell a small story showing what happens (setting → action → outcome), and end with one friendly question.")
                persona_lines.append("Avoid headings and lists; write in 3–5 short paragraphs so it’s easy to follow.")
            elif age_group == 'teen':
                persona_lines.append("Keep it concise, friendly, and practical — one or two short paragraphs.")
            else:
                persona_lines.append("Be concise and conversational; avoid lists unless explicitly asked.")
            persona_lines.append("When appropriate, end with one short follow-up question to keep the chat flowing.")
            persona_lines.append("Do not include role labels or markdown headings in the reply.")
            persona_lines.append("If the context below is thin, still answer helpfully using safe, widely-known facts.")

            system_preface = "\n".join(persona_lines)

            # Include the last few conversation turns to maintain continuity
            convo_lines = []
            for m in history:
                try:
                    role = str(m.get('role', '')).strip().lower()
                    content = str(m.get('content', '')).strip()
                    if not content:
                        continue
                    if role == 'user':
                        convo_lines.append(f"User: {content}")
                    elif role == 'assistant':
                        convo_lines.append(f"Assistant: {content}")
                except Exception:
                    continue
            conversation_block = "\n".join(convo_lines)

            full_prompt = (
                f"System instructions:\n{system_preface}\n\n"
                f"Conversation so far:\n{conversation_block}\n\n"
                f"Context:\n{context}\n\n"
                f"User message:\n{prompt}\n\n"
                f"Assistant reply:"
            )
            # 2) If forced fallback or model missing, return a quick templated answer
            if force_fallback or model_missing:
                logger.info(f"/llama-chat: using fallback (force={force_fallback}, model_missing={model_missing}, age_group={age_group})")
                result = _conversational_fallback(prompt, user_name, age_group, history)
                latency_ms = int((time.time() - req_start) * 1000)
                return jsonify({
                    "result": result,
                    "retrieved_count": len(retrieved_chunks),
                    "temperature": 0.0,
                    "top_p": 1.0,
                    "used_max_new_tokens": 0,
                    "latency_ms": latency_ms,
                    "wants_long": False,
                })

            # 3) Tune generation conservatively, especially on CPU
            temperature = 0.2
            top_p = 0.9
            # Defaults can be overridden via environment
            default_tokens = 64 if _LLM_DEVICE == 'cpu' else 128
            max_new_tokens = int(os.environ.get("LLAMA_MAX_NEW_TOKENS", str(default_tokens)))
            if age_group == 'kid':
                temperature = 0.7
                # Kids want a much longer, story-like answer
                kid_tokens = 320 if _LLM_DEVICE == 'cpu' else 600
                max_new_tokens = max(max_new_tokens, kid_tokens)
            elif age_group == 'teen':
                temperature = 0.4
                teen_tokens = 80 if _LLM_DEVICE == 'cpu' else 140
                max_new_tokens = min(max_new_tokens, teen_tokens)

            # Cap input token length as well to reduce memory
            max_input_tokens = int(os.environ.get("LLAMA_MAX_INPUT_TOKENS", "1024"))

            try:
                import torch
                no_grad_ctx = torch.inference_mode
            except Exception:
                # Fallback if torch isn't available for context manager type
                class _NoopCtx:
                    def __enter__(self):
                        return None
                    def __exit__(self, exc_type, exc, tb):
                        return False
                def no_grad_ctx():
                    return _NoopCtx()

            inputs = tokenizer(
                full_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=max_input_tokens,
            ).to(llm.device)

            # Use no grad and optionally disable cache to keep memory low
            do_sample = False if _LLM_DEVICE == 'cpu' else True
            generate_kwargs = dict(
                max_new_tokens=max_new_tokens,
                do_sample=do_sample,
                use_cache=False if _LLM_DEVICE == 'cpu' else True,
            )
            if do_sample:
                # Only pass sampling args when sampling is enabled to avoid warnings
                generate_kwargs.update(temperature=temperature, top_p=top_p)
            # Limit wall-clock time for generation to avoid long blocking requests
            max_time = float(os.environ.get('LLAMA_MAX_TIME', '10.0' if _LLM_DEVICE == 'cpu' else '20.0'))
            if max_time > 0:
                generate_kwargs['max_time'] = max_time

            try:
                with no_grad_ctx():
                    output = llm.generate(**inputs, **generate_kwargs)
                # Decode only newly generated tokens to avoid echoing the prompt
                input_len = int(inputs["input_ids"].shape[1])
                gen_tokens = output[0][input_len:]
                result = tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
            except Exception as gen_err:
                # Graceful fallback: short, friendly template answer to avoid request crash
                logger.error(f"LLM generation failed, using fallback: {gen_err}")
                result = _conversational_fallback(prompt, user_name, age_group, history)
            logging.debug(f"Generated response: {result}")
            latency_ms = int((time.time() - req_start) * 1000)

            # Optionally produce TTS for the assistant reply.
            # Control via request JSON 'tts' flag (true/false/string) or env 'LLAMA_AUTOTTS'.
            want_tts = False
            try:
                env_autotts = os.environ.get('LLAMA_AUTOTTS', '').strip().lower()
                if env_autotts in ('1', 'true', 'yes'):
                    want_tts = True
                req_tts = data.get('tts')
                if isinstance(req_tts, bool):
                    want_tts = req_tts
                elif isinstance(req_tts, str):
                    if req_tts.strip().lower() in ('1', 'true', 'yes'):
                        want_tts = True
            except Exception:
                want_tts = False

            audio_url = None
            tts_error = None
            if want_tts:
                try:
                    voice_id = data.get('voice') or data.get('ttsVoice') or None
                    # Prefer offline local-basic TTS for assistant reply
                    out_path = unique_filename('speech', 'wav')
                    wav_path = tts_local_basic(result, out_path=out_path, voice=voice_id)
                    filename = os.path.basename(wav_path)
                    audio_url = f"/generated_audio/{filename}"
                except Exception as tte:
                    logger.exception('Failed to generate TTS for assistant reply')
                    tts_error = str(tte)

            resp = {
                "result": result,
                "retrieved_count": len(retrieved_chunks),
                "temperature": round(float(temperature), 2),
                "top_p": round(float(top_p), 2),
                "used_max_new_tokens": int(max_new_tokens),
                "latency_ms": latency_ms,
                "wants_long": False,
            }
            if audio_url:
                resp['audio_url'] = audio_url
            if tts_error:
                resp['tts_error'] = tts_error
            return jsonify(resp)
        except Exception as e:
            logging.error(f"Error in /llama-chat: {e}")
            return jsonify({"error": str(e)}), 500

    return app
app = create_app()

# Kick off TTS preload once the Flask app has been created
try:
    skip_tts = (os.environ.get('SKIP_TTS_LOAD') or os.environ.get('SKIP_TTS') or '').strip().lower()
    if skip_tts in ('1', 'true', 'yes'):
        logger.info('SKIP_TTS_LOAD set — skipping TTS preload at startup')
    else:
        _preload_tts_async()
except Exception:
    # Non-fatal
    logger.exception('Failed to evaluate/start TTS preload')

if __name__ == '__main__':  # pragma: no cover
    # Disable debug in container to avoid reloader killing the process on exceptions
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
