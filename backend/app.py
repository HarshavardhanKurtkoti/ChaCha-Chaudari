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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress pdfminer warnings
logging.getLogger("pdfminer").setLevel(logging.ERROR)

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

# Transformers / Llama
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

# TTS
import asyncio
import edge_tts

# Load environment variables
env_vars = dotenv_values('.env')
AssistantVoice = env_vars.get('AssistantVoice', 'en-US-JennyNeural')
InputLanguage = env_vars.get('InputLanguage', 'en')
MODEL_REPO = './Llama-2-7b-chat-hf'

# Ensure Data dir
DATA_DIR = os.path.join(os.getcwd(), 'Data')
os.makedirs(DATA_DIR, exist_ok=True)

# Helper: generate unique filename
def unique_filename(prefix: str, ext: str):
    return os.path.join(DATA_DIR, f"{prefix}_{uuid.uuid4().hex}.{ext}")

# Async TTS saver
async def _save_tts_async(text: str, voice: str, out_path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)

def generate_tts_file(text: str, voice: str = AssistantVoice) -> str:
    """Generates an mp3 TTS file and returns its path. Caller should remove file when done."""
    out_path = unique_filename('speech', 'mp3')
    try:
        asyncio.run(_save_tts_async(text, voice, out_path))
        return out_path
    except Exception as e:
        logger.exception('TTS generation failed')
        if os.path.exists(out_path):
            try:
                os.remove(out_path)
            except Exception:
                pass
        raise

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

# Load tokenizer + model (with bitsandbytes config if available)
tokenizer = None
llm = None
logger.info('Loading GPTQ tokenizer and model...')
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, use_fast=True, local_files_only=True)
    llm = AutoModelForCausalLM.from_pretrained(
        MODEL_REPO,
        device_map='auto',
        trust_remote_code=True,
        local_files_only=True,
    )
    logger.info('GPTQ model loaded')
except Exception as e:
    logger.exception('Failed to load GPTQ model')
    tokenizer, llm = None, None

def create_app():
    app = Flask(__name__)

    # CORS configuration (allow frontend origin if provided)
    frontend_origin = env_vars.get('FRONTEND_URL')
    if frontend_origin:
        CORS(app, resources={r"/*": {"origins": [frontend_origin]}}, supports_credentials=True)
    else:
        CORS(app)

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
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        try:
            out_path = generate_tts_file(text)
            return send_file(out_path, mimetype='audio/mpeg', as_attachment=False)
        except Exception as e:
            logger.exception('TTS endpoint error')
            return jsonify({'error': 'TTS generation failed', 'details': str(e)}), 500

    @app.route('/stt', methods=['POST'])
    def stt_endpoint():
        data = request.get_json() or {}
        text = data.get('text')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        return jsonify({'result': text})

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'ok',
            'rag_ready': embedder is not None and index is not None and chunks is not None,
            'llm_ready': tokenizer is not None and llm is not None
        })

    @app.route('/llama-chat', methods=['GET', 'POST'])
    def llama_chat():
        logging.debug("Request received at /llama-chat")
        if request.method == 'GET':
            return jsonify({
                'error': 'Use POST with JSON payload {"prompt": "..."}',
                'example': {'prompt': 'Hello'}
            }), 405
        if embedder is None or index is None or chunks is None:
            return jsonify({"error": "RAG components not initialized"}), 503
        if tokenizer is None or llm is None:
            return jsonify({"error": "LLM not initialized"}), 503
        try:
            data = request.get_json() or {}
            prompt = data.get("prompt")
            if not prompt:
                return jsonify({"error": "No prompt provided"}), 400

            logging.debug(f"Prompt received: {prompt}")
            query_emb = embedder.encode([prompt])
            # ensure numpy array with shape (1, D)
            query_arr = np.array(query_emb, dtype=np.float32)
            if query_arr.ndim == 1:
                query_arr = np.expand_dims(query_arr, 0)
            D, I = index.search(query_arr, k=3)
            retrieved_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
            context = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else ""

            full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}\n\nAnswer:"
            inputs = tokenizer(full_prompt, return_tensors="pt").to(llm.device)
            output = llm.generate(**inputs, max_new_tokens=128, do_sample=True, temperature=0.2)
            result = tokenizer.decode(output[0], skip_special_tokens=True)
            logging.debug(f"Generated response: {result}")
            return jsonify({"result": result, "retrieved_count": len(retrieved_chunks)})
        except Exception as e:
            logging.error(f"Error in /llama-chat: {e}")
            return jsonify({"error": str(e)}), 500

    return app
app = create_app()

if __name__ == '__main__':  # pragma: no cover
    # Disable debug in container to avoid reloader killing the process on exceptions
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
