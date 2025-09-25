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
os.environ.setdefault("TRANSFORMERS_NO_AUDIO", "1")
os.environ.setdefault("TRANSFORMERS_NO_TORCHVISION", "1")
os.environ.setdefault("NUMBA_DISABLE_JIT", "1")
import uuid
import logging
import struct
import time
from dotenv import dotenv_values
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

# RAG utils (lightweight hash-based embeddings now)
from rag_utils import index, chunks, hash_embed, query as rag_query

# Transformers / Llama
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

# TTS
import asyncio
import edge_tts

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

tokenizer = None  # will be loaded lazily
llm = None
_model_error = None
_model_loading = False

def load_model():
    """Lazy load the model with 4-bit quantization if possible.
    Avoids blocking container startup and lets /healthz respond earlier.
    """
    global tokenizer, llm, _model_error, _model_loading
    if llm is not None and tokenizer is not None:
        return True
    if _model_loading:
        return False  # another request is triggering load
    _model_loading = True
    t0 = time.time()
    logger.info('Beginning lazy model load...')
    try:
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type='nf4',
            bnb_4bit_use_double_quant=True,
        )
    except Exception:
        bnb_config = None
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, use_fast=True, local_files_only=True)
        load_kwargs = dict(
            device_map='auto', trust_remote_code=True, local_files_only=True
        )
        if bnb_config is not None:
            load_kwargs['quantization_config'] = bnb_config
        try:
            llm_local = AutoModelForCausalLM.from_pretrained(MODEL_REPO, **load_kwargs)
        except Exception as inner:
            logger.warning(f"4-bit load failed or not supported: {inner}; retrying without quantization")
            # fallback full precision (may be heavy)
            load_kwargs.pop('quantization_config', None)
            llm_local = AutoModelForCausalLM.from_pretrained(MODEL_REPO, **load_kwargs)
        llm_local.eval()
        # assign only after success so other threads don't see partial
        llm = llm_local
        dt = time.time() - t0
        logger.info(f'Model loaded successfully in {dt:.1f}s')
        return True
    except Exception as e:
        _model_error = str(e)
        logger.exception('Lazy model load failed')
        return False
    finally:
        _model_loading = False

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
        from .auth import auth_bp  # type: ignore
        from .chat_routes import chat_bp  # type: ignore
        app.register_blueprint(auth_bp)
        app.register_blueprint(chat_bp)
    except Exception as e:
        logger.warning(f"Blueprint registration failed (possibly during import stage): {e}")

    # Legacy endpoints kept below

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

    @app.route('/llama-chat', methods=['POST'])
    def llama_chat():  # noqa: C901
        print("DEBUG: /llama-chat endpoint called")
        data = request.get_json() or {}
        prompt = data.get('prompt')
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Ensure model is loaded
        if llm is None:
            started = load_model()
            if llm is None:
                # still not available
                status = 'loading' if _model_error is None else 'error'
                return jsonify({'error': 'model_unavailable', 'status': status, 'details': _model_error}), 503

        user_token = request.headers.get('Authorization')
        if user_token:
            try:
                import base64, json
                decoded = base64.b64decode(user_token).decode('utf-8')
                user_info = json.loads(decoded)
                logger.info(f'Received user_info: {user_info}')
            except Exception:
                logger.info('Invalid Authorization token format')

        try:
            # Retrieve top chunks (lightweight hash embedding)
            retrieved = rag_query(prompt, top_k=3)  # list of {chunk, distance}
            retrieved_chunks = [r["chunk"] for r in retrieved]
            context = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else ""

            def truncate_text(text, max_chars=3000):
                return text[:max_chars]

            safe_prompt = truncate_text(prompt, 500)
            safe_context = truncate_text(context, 2500)

            if safe_context:
                full_prompt = f"Use the following context to answer the question. If the context doesn't contain the answer, be honest and say you don't know.\n\nContext:\n{safe_context}\n\nQuestion:\n{safe_prompt}\n\nAnswer:"
            else:
                full_prompt = f"Question:\n{safe_prompt}\n\nAnswer:"

            t_prep = time.time()
            inputs = tokenizer(full_prompt, return_tensors='pt')
            inputs = {k: v.to(llm.device) for k, v in inputs.items()}
            logger.info(f"Tokenized prompt in {time.time()-t_prep:.2f}s; generating...")
            gen_start = time.time()
            # ---- Dynamic generation parameter logic ----
            prompt_lower = prompt.lower()
            long_keywords = [
                'explain','detailed','elaborate','report','summarize','compare',
                'list','outline','analyze','advantages','disadvantages','reason','why','steps'
            ]
            wants_long = any(k in prompt_lower for k in long_keywords)
            desired_answer_tokens = 256 if wants_long else 96
            user_req_max = data.get('max_new_tokens')
            if isinstance(user_req_max, int) and 16 <= user_req_max <= 1024:
                desired_answer_tokens = user_req_max
            try:
                ctx_window = getattr(llm.config, 'max_position_embeddings', 4096)
            except Exception:
                ctx_window = 4096
            input_token_len = inputs['input_ids'].shape[1]
            safety_margin = 64
            available_for_new = max(32, ctx_window - input_token_len - safety_margin)
            max_new_tokens = min(desired_answer_tokens, available_for_new)
            # Adaptive temperature/top_p
            if wants_long:
                temperature = float(data.get('temperature', 0.75))
                top_p = float(data.get('top_p', 0.95))
            else:
                temperature = float(data.get('temperature', 0.55))
                top_p = float(data.get('top_p', 0.9))
            temperature = max(0.1, min(temperature, 1.5))
            top_p = max(0.1, min(top_p, 1.0))
            logger.info(
                f"Generation params: max_new_tokens={max_new_tokens} wants_long={wants_long} input_tokens={input_token_len} ctx_window={ctx_window} temp={temperature} top_p={top_p}"
            )
            with torch.inference_mode():
                output = llm.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=True,
                    temperature=temperature,
                    top_p=top_p,
                    repetition_penalty=1.05,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
            gen_time = time.time()-gen_start
            logger.info(f"Generation completed in {gen_time:.2f}s")
            result = tokenizer.decode(output[0], skip_special_tokens=True)
            if result.startswith(full_prompt):
                result = result[len(full_prompt):].strip()
            new_tokens_generated = output[0].shape[0] - inputs['input_ids'].shape[1]
            truncated = new_tokens_generated >= max_new_tokens
            return jsonify({
                'result': result,
                'retrieved_count': len(retrieved_chunks),
                'used_max_new_tokens': max_new_tokens,
                'new_tokens_generated': int(new_tokens_generated),
                'truncated': truncated,
                'wants_long': wants_long,
                'temperature': temperature,
                'top_p': top_p,
                'generation_time_sec': round(gen_time,2)
            })
        except Exception as e:
            logger.exception('Error in /llama-chat')
            return jsonify({'error': str(e)}), 500

    return app
app = create_app()

@app.route('/healthz', methods=['GET'])
def healthz():
    if llm is not None:
        return {'status': 'ok'}, 200
    if _model_error:
        return {'status': 'error', 'details': _model_error}, 500
    if _model_loading:
        return {'status': 'loading'}, 206
    return {'status': 'not_loaded'}, 202

if __name__ == '__main__':  # pragma: no cover
    app.run(host='0.0.0.0', port=5000, debug=False)
