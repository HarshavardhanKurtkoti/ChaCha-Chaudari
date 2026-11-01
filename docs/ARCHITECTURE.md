# SmartGanga Mascot (ChaCha-Chaudari) — System Architecture

## 1. System Overview

SmartGanga Mascot is an AI/ML and Retrieval-Augmented Generation (RAG) platform featuring the legendary Indian comic character **Chacha Chaudhary** as an interactive digital ambassador for the Namami Gange programme. The system educates children, teenagers, and adult citizens on Ganga river ecology, conservation initiatives, and water pollution abatement.

The architecture is built for **resilient offline-first execution** while retaining modern web capabilities:
- **Frontend:** React 18, Vite, Tailwind CSS, Mantine, Three.js / React Three Fiber (3D Mascot), Framer Motion.
- **Backend:** Python Flask modular API with application factory, blueprint routing, PyMongo with automatic in-memory fallback, and rate limiting.
- **Inference & RAG:** Local transformer pipeline (Phi-3-mini / Llama-2 with 4-bit quantization), FAISS / Sentence-Transformers dense vector retrieval over official NMCG documents, and bilingual Devanagari translation bridging.
- **Audio Pipeline:** Low-latency streaming TTS proxy (Piper ONNX offline voices -> gTTS / Edge-TTS -> Pyttsx3 fallback) and browser Web Speech STT.

```
+-------------------------------------------------------------------------+
|                           Client Browser                                |
|  +--------------------+  +--------------------+  +--------------------+ |
|  |  React UI / Pages  |  | 3D Avatar (ThreeJS)|  | Audio / STT (Mic)  | |
|  | (Dashboard, Games) |  | (WebGL + 2D backup)|  | (SpeechRecognition)| |
|  +---------+----------+  +---------+----------+  +---------+----------+ |
|            |                       |                       |            |
|            +-----------------------+-----------------------+            |
|                                    |                                    |
|                        src/config/api.js (Central)                      |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               | HTTP / NDJSON Stream                      | HTTP Audio / WAV
               v                                           v
+-------------------------------+         +-------------------------------+
|     Main Backend (Port 5000)  |         |     TTS Proxy (Port 6001)     |
|  - App Factory (CORS, Limiter)|         |  - Piper ONNX Offline Engine  |
|  - /auth/* (JWT, Google OAuth)|         |  - Indian English & Hindi     |
|  - /chats/* (Chat Session DB) |         |  - Low Latency Buffer Stream  |
|  - /game/* (Anti-Tamper Score)|         |  - Fallback: Edge / gTTS / Mock|
|  - /llama-chat[-stream]       |         +-------------------------------+
+---------------+---------------+
                |
    +-----------+-----------+
    |                       |
    v                       v
+------------------+  +---------------------------------------------+
|    RAG Service   |  |                  LLM Service                |
| - FAISS Index    |  | - Lazy Loading (CUDA / CPU Auto-detect)     |
| - SentenceTransf |  | - 4-bit Quantization (BitsAndBytes)         |
| - 384-dim Embed  |  | - Age-Adaptive Persona Assembly             |
| - Top-3 Chunks   |  |   (Child / Youth / Adult Citizen)           |
| - Seed Fallback  |  | - TextIteratorStreamer -> NDJSON Token Feed |
+------------------+  +---------------------------------------------+
```

---

## 2. Frontend Layer

### Provider Hierarchy
```
React Root
  └─ ErrorBoundary (Catches unhandled render faults)
      └─ MantineProvider (Theme & UI primitives)
          └─ AuthProvider (JWT lifecycle, token expiration, multi-tab sync)
              └─ BrowserRouter
                  └─ RouteContainer (All page views + 404 handler)
```

### Key Modules
1. **`src/config/api.js`:** Single source of truth for all API endpoint URLs with `VITE_API_BASE_URL` and `VITE_TTS_BASE_URL` environment overrides.
2. **`src/components/Bot.jsx`:** 3D avatar viewport with WebGL capabilities check, graceful canvas fallback to 2D illustrated animated avatars (`Lspeaking-bg.png` and `chacha.webp`), and reduced-motion preferences.
3. **`src/components/ChatBot.jsx`:** Streaming conversational interface supporting NDJSON token streaming, live visualizer audio playback, Hindi speech recognition, and age selector pills.
4. **`src/context/AuthContext.jsx`:** Client-side state manager for authentication tokens, expiration detection, login, logout, and automatic profile claim synchronization.

---

## 3. Backend Architecture

### Application Factory (`backend/app.py`)
- Initialized via `create_app()`.
- Centralized CORS configuration from `config.py`.
- Global rate limiting using Flask-Limiter (`120/min` default, `20/min` heavy LLM inference).
- Normalized JSON error envelope handlers for 400, 401, 403, 404, 429, and 500 error codes.

### Service Modules
- **`services/llm_service.py`:** Manages language model lifecycle with thread-safe double-checked locking, automatic device assignment (`cuda` vs `cpu`), 4-bit quantization, and prompt formatting for Kid, Teen, and Adult personas.
- **`services/rag_service.py`:** Non-blocking knowledge retrieval pipeline loading persistent numpy matrices, FAISS indices, or high-speed hash embedding fallbacks.
- **`services/translation_service.py`:** Detects Devanagari Hindi characters and normalizes terminology between Hindi user inputs and English RAG knowledge corpora.
- **`services/tts_service.py`:** Orchestrates audio synthesis through a priority chain: Piper ONNX -> gTTS -> Edge-TTS -> Pyttsx3 -> Synthesized tone mock.

### Authoritative Gamification Engine (`backend/game_routes.py`)
- Replaces unvalidated client-side state with server-enforced business logic:
  - **Score Caps:** Anti-tampering limits per mission (Quiz: 50, Trash: 100, River Cleanup: 250).
  - **Streak Multipliers:** `1.0 + (streak * 0.1)`, capped at `1.5x`.
  - **Daily Rewards:** Atomic verification of UTC calendar day; duplicate claims within the same calendar day are rejected with HTTP 409.
  - **Privacy Location:** Coordinate bounding validation and truncation to 4 decimal places (~11 meters).

---

## 4. Security Architecture

1. **JWT Verification:** Signed with `HS256` using validated secret keys. Expired signatures and malformed tokens return structured HTTP 401.
2. **Rate Limiting:** Protects expensive GPU/CPU LLM inference endpoints from resource exhaustion attacks.
3. **Prepared Persistence:** Abstracted PyMongo queries avoid injection; in-memory fallback matches query signatures.
4. **Safe Error Envelopes:** Internal python stack traces and database errors are suppressed in API responses and routed to structured logs.

