# Tools, Frameworks, and Versions

This list is derived from `backend/requirements.txt`, `frontend/package.json`, and the `Dockerfile` in this repository as of 2025-09-25.

## Backend (Python)
- Python: 3.10+ (container base: nvcr.io/nvidia/pytorch:23.06-py3)
- PyTorch: 2.5.1 (via pip; NVIDIA container includes CUDA/cuDNN)
- Transformers: 4.56.1
- Auto GPTQ: 0.7.1 (quantization compatibility)
- bitsandbytes: 0.47.0 (8-bit/4-bit inference support)
- Flask: 3.1.2
- flask-cors: 6.0.1
- FAISS (CPU): 1.12.0
- sentence-transformers: 5.1.0 (optional; currently replaced by lightweight hash-based embeddings in `rag_utils.py`)
- numpy, scipy, pandas
- pdfplumber: 0.11.7 (PDF text extraction)
- python-dotenv (configuration)
- edge-tts: 7.2.3 (Text-to-Speech)
- requests, tqdm, safetensors, tokenizers: 0.22.0, optimum
- MongoDB client: pymongo 4.9.2
- JWT: PyJWT 2.9.0
- Text processing: textblob 0.18.0.post0 (optional)
- Experimental scripts: `huggingface_hub`, `ctransformers` (via `download.py`, `run_llama.py`)

## Frontend (Web)
- React: 18.2.0
- Vite: 4.4.5 (dev server/build)
- UI: Mantine 6.0.x, TailwindCSS 3.3.x
- Routing: react-router-dom 6.16.0
- Markdown: react-markdown 8.x + remark-gfm 3.x
- Speech/Voice: react-speech-recognition 3.10.0; audio playback of backend `/tts`
- Multilingual: bhashini-translation 1.0.4
- 3D/Graphics (optional pages): three 0.152, @react-three/fiber, @react-three/drei
- HTTP: axios 1.5.0

## Database
- MongoDB (self-hosted or managed) with indexes defined in `backend/db.py`.

## DevOps / Runtime
- Docker base: NVIDIA PyTorch 23.06-py3
- CUDA GPU passthrough: `--gpus all` (optional)
- ENV flags to avoid audio/numba conflicts: `TRANSFORMERS_NO_AUDIO=1`, `TRANSFORMERS_NO_TORCHVISION=1`, `NUMBA_DISABLE_JIT=1`
- Ports: Backend 5000 (mapped, e.g., 5001:5000)
- Volumes: bind mount `backend/Data` and `backend/Llama-2-7b-chat-hf` into the container

## Notable Files and Modules
- `backend/app.py`: Flask app factory; `/llama-chat`, `/tts`, `/stt`; blueprint registration
- `backend/rag_utils.py`: PDF parsing, chunking, hash embeddings, FAISS index
- `backend/auth.py`: JWT auth, register/login, admin
- `backend/chat_routes.py`: chat persistence APIs
- `backend/db.py`: MongoDB client, indexes, helpers
- `frontend/src/App.jsx`: router, auth modal, Bhashini init
- `Dockerfile`: build and runtime environment for GPU inference
