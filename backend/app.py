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

# TTS
import asyncio

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
    # Lazy import to avoid import error when edge_tts isn't installed
    try:
        import edge_tts  # type: ignore
    except Exception as e:
        raise RuntimeError(f"edge-tts not available: {e}")
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
try:
    if _TRANSFORMERS_AVAILABLE:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, use_fast=True, local_files_only=True)
        llm = AutoModelForCausalLM.from_pretrained(
            MODEL_REPO,
            device_map='auto',
            trust_remote_code=True,
            local_files_only=True,
        )
        try:
            import torch as _torch  # type: ignore
            _LLM_DEVICE = next(llm.parameters()).device.type  # cuda or cpu
        except Exception:
            _LLM_DEVICE = "cpu"
        logger.info(f'LLM loaded on {_LLM_DEVICE}')
    else:
        logger.info('LLM skipped (transformers/torch not available)')
except Exception as e:
    logger.exception('Failed to load LLM')
    tokenizer, llm = None, None

# ---------------------------
# Fallback story builders
# ---------------------------
def _kid_story_about(topic: str, name: str | None) -> str:
    t = (topic or "").strip()
    nm = (name or "friend").strip()
    lt = t.lower()
    # Special-case: Namami Gange
    if "namami gange" in lt or "namami ganga" in lt:
        return (
            f"Hi {nm}, I’m ChaCha, the River Guardian. "
            f"Namami Gange is India’s big plan to clean and protect the Ganga River. "
            f"We build plants to clean dirty water, stop trash and sewage, plant trees, and keep animals safe. "
            f"When people work together, the river becomes healthy and happy again. "
            f"Ganga dolphins love clean water and they make our river special."
        )
    # Generic topic-aware fallback
    return (
        f"Hi {nm}, I’m ChaCha, the River Guardian. "
        f"Here is {t} in simple words you can follow. "
        f"This is the big idea explained in a small, clear way. "
        f"You can use this to understand and share with friends. "
        f"Curious kids grow wise by asking questions every day."
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
            'llm_ready': tokenizer is not None and llm is not None,
            'llm_device': _LLM_DEVICE,
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
            # If Authorization header carries a Bearer token from our auth module, try to decode basics
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
                            age_group = 'kid' if age_claim < 10 else 'teen' if age_claim < 16 else 'adult'
            except Exception:
                pass
            if not prompt:
                return jsonify({"error": "No prompt provided"}), 400

            logging.debug(f"Prompt received: {prompt}")
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
            if age_group == 'kid':
                # TTS-friendly, conversational kid style
                persona_lines.append("Speak as ChaCha, the River Guardian, using first-person words (I/me).")
                persona_lines.append("Start by greeting the child by name with 'Hi <name>,' if known.")
                persona_lines.append("Use a friendly, conversational tone that talks directly to the child (you).")
                persona_lines.append(" No lists, no headings, no role labels, no emojis, and no quoted dialogue.")
                persona_lines.append("Clearly answer the question in simple words and keep it positive and safe.")
                persona_lines.append("Only output the final message text; do not include any labels or extra commentary.")
                persona_lines.append("End with a friendly fun fact as the final sentence, without using a label like 'Fun fact:'.")
            elif age_group == 'teen':
                persona_lines.append("Explain for teenagers with relatable examples, keep it concise and factual, slightly more advanced than kids.")
            else:
                persona_lines.append("Explain for adults with clear structure; concise, factual, optionally provide 2-3 bullet points.")

            # Global rule: if context is thin, still answer helpfully; never say "not mentioned in the context"
            persona_lines.append("If the provided context is missing or incomplete, still answer helpfully using safe, widely-known facts relevant to the question.")
            persona_lines.append("Do not say that something is not mentioned in the context; simply answer in the requested style.")

            system_preface = "\n".join(persona_lines)

            full_prompt = (
                f"System instructions:\n{system_preface}\n\n"
                f"Context:\n{context}\n\n"
                f"Question:\n{prompt}\n\n"
                f"Answer:"
            )
            # 2) If forced fallback or model missing, return a quick templated answer
            if force_fallback or model_missing:
                if age_group == 'kid':
                    result = _kid_story_about(prompt, user_name)
                elif age_group == 'teen':
                    result = _teen_short_about(prompt)
                else:
                    result = _adult_short_about(prompt)
                return jsonify({
                    "result": result,
                    "retrieved_count": len(retrieved_chunks),
                    "temperature": 0.0,
                    "top_p": 1.0,
                    "used_max_new_tokens": 0,
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
                # kid content can be a bit longer, but keep cap on CPU
                kid_tokens = 96 if _LLM_DEVICE == 'cpu' else 160
                max_new_tokens = min(max_new_tokens, kid_tokens)
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
                if age_group == 'kid':
                    result = _kid_story_about(prompt, user_name)
                elif age_group == 'teen':
                    result = _teen_short_about(prompt)
                else:
                    result = _adult_short_about(prompt)
            logging.debug(f"Generated response: {result}")
            latency_ms = int((time.time() - req_start) * 1000)
            return jsonify({
                "result": result,
                "retrieved_count": len(retrieved_chunks),
                "temperature": round(float(temperature), 2),
                "top_p": round(float(top_p), 2),
                "used_max_new_tokens": int(max_new_tokens),
                "latency_ms": latency_ms,
                "wants_long": False,
            })
        except Exception as e:
            logging.error(f"Error in /llama-chat: {e}")
            return jsonify({"error": str(e)}), 500

    return app
app = create_app()

if __name__ == '__main__':  # pragma: no cover
    # Disable debug in container to avoid reloader killing the process on exceptions
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
