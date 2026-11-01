# SmartGanga Mascot — Development Guide

## Prerequisites
- **Node.js:** v18+ (v20 LTS recommended)
- **Python:** 3.10 to 3.13
- **Package Managers:** npm (frontend), pip or uv (backend)
- **MongoDB:** (Optional) local instance on port 27017. If not present, the app automatically runs on the integrated in-memory database.

---

## 1. Quickstart (Development Mode)

### Step 1: Clone and Setup Backend
```bash
# From repository root
cd backend

# Option A: using uv (recommended for fast virtualenv creation)
uv venv .venv --python 3.13
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Linux/macOS
uv pip install -r requirements.txt

# Option B: standard python venv
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
# In backend/
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/macOS
```

### Step 3: Run Backend Service
```bash
python app.py
```
Backend starts on `http://127.0.0.1:5000`.

### Step 4: (Optional) Run Standalone TTS Proxy
In a second terminal:
```bash
cd backend
python tts_proxy.py --engine piper --port 6001
# Or on Windows: .\scripts\start_tts_proxy_piper.ps1
```

### Step 5: Setup and Run Frontend
In a third terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend development server opens at `http://localhost:5173`.

---

## 2. Running Test Suites

### Backend Unit & Integration Tests (Pytest)
```bash
# From repository root
backend\.venv\Scripts\pytest backend\tests -v
```
All 24 test cases across Auth, Chat, Games, Location, Health, and Speech run in ~10 seconds.

### Frontend Unit Tests (Vitest)
```bash
cd frontend
npm test
```

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```

---

## 3. Docker Compose Deployment

To run all four services (MongoDB, Backend, TTS Proxy, and Frontend) in isolated containers:
```bash
docker compose up --build -d
```
Access the application at:
- Frontend: `http://localhost:80`
- API Health: `http://localhost:5000/health`
- TTS Proxy: `http://localhost:6001/health`
- MongoDB: `localhost:27017`

