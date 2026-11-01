# SmartGanga Mascot: AI/ML and Chatbot-Powered Digital Avatar for Namami Gange

[![CI Status](https://github.com/NamamiGange/ChaCha-Chaudari/actions/workflows/ci.yml/badge.svg)](https://github.com/NamamiGange/ChaCha-Chaudari/actions)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Three.js-61DAFB?logo=react)](frontend/)
[![Flask](https://img.shields.io/badge/Backend-Python%20Flask%20%7C%20PyTorch-000000?logo=flask)](backend/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An interactive, offline-first digital avatar inspired by **Chacha Chaudhary**—the declared mascot of the **Namami Gange Programme** (in collaboration with Diamond Toons and NMCG)—designed to educate citizens of all ages about river conservation, Ganga ecology, pollution abatement, and biodiversity.

---

## Key Features

- **Age-Adaptive Grounded Conversational AI:** Adapts persona, tone, and depth dynamically for **Children** (story-driven, friendly), **Youth** (ecological actions), and **Adults** (policy and technical facts).
- **Offline-First RAG Knowledge Base:** Dense retrieval via Sentence-Transformers / FAISS indexed over official NMCG mission documents, with instant seed-chunk fallback.
- **Bilingual English & Hindi:** Automatic Devanagari detection and terminology mapping bridging Hindi queries with English official knowledge corpora.
- **Streaming Audio Synthesis (TTS):** Low-latency synthesis via high-performance Piper ONNX proxy (`hi_IN` and `en_IN`), cascading automatically to gTTS, Edge-TTS, and Pyttsx3.
- **Browser Speech-to-Text (STT):** Continuous hands-free voice input via Web Speech API.
- **Interactive 3D Avatar:** Real-time Three.js / React Three Fiber mascot with WebGL detection and automatic illustrated 2D fallback for low-power devices.
- **Authoritative Gamification:** Server-validated daily login rewards (once per calendar day), streak multipliers, anti-tampering score caps, badges, and live leaderboards.
- **River Basin War Room & Ganga Museum:** Interactive touch-friendly virtual exhibits featuring 3D tilt cards, parallax displays, and ecological exploration carousels.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Mantine, Three.js, React Three Fiber, Framer Motion, Axios, Vitest |
| **Backend** | Python 3.11+, Flask, Flask-CORS, Flask-Limiter, PyMongo / In-Memory Mock, PyJWT, Bcrypt, Pytest |
| **AI / ML & RAG** | Hugging Face Transformers (`Phi-3-mini` / `Llama-2`), Sentence Transformers (`all-MiniLM-L6-v2`), FAISS, NumPy |
| **Speech** | Piper TTS (ONNX), gTTS, Edge-TTS, Pyttsx3, Browser Web Speech Recognition |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD, Nginx |

---

## Quickstart

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (Python 3.11–3.13 recommended)
- (Optional) Docker & Docker Compose

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt

# Start Flask API (defaults to http://127.0.0.1:5000)
python app.py
```

### 3. (Optional) Run Dedicated TTS Proxy
In a separate terminal:
```bash
cd backend
python tts_proxy.py --engine piper --port 6001
# Or on Windows: .\scripts\start_tts_proxy_piper.ps1
```

### 4. Frontend Setup
In a third terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Docker Compose (Full Stack)

To run the entire ecosystem (MongoDB, Flask Backend, Piper TTS Proxy, and Nginx Frontend) in one command:
```bash
docker compose up --build -d
```
- **Frontend App:** [http://localhost:80](http://localhost:80)
- **Backend API:** [http://localhost:5000/health](http://localhost:5000/health)
- **TTS Proxy:** [http://localhost:6001/health](http://localhost:6001/health)

---

## Running Tests

### Backend Unit & Integration Tests (24 Suites)
```bash
backend\.venv\Scripts\pytest backend\tests -v
```

### Frontend Unit Tests (7 Suites)
```bash
cd frontend
npm test
```

### Frontend Production Bundle Build
```bash
cd frontend
npm run build
```

---

## Documentation Index

- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [REST API Specification](docs/API.md)
- [Developer Onboarding & Setup](docs/DEVELOPMENT.md)
- [Troubleshooting & FAQ](docs/TROUBLESHOOTING.md)
- [Standalone TTS Setup](docs/tts_standalone.md)
- [Repair Plan & Audit](docs/REPAIR_PLAN.md)
- [Final Changelog](FINAL_CHANGELOG.md)
- [Final Status & Audit Table](FINAL_STATUS.md)

---

## License
This project is licensed under the MIT License.
SmartGanga Mascot artwork and Chacha Chaudhary intellectual property rights are managed in accordance with NMCG and Diamond Toons agreements.
