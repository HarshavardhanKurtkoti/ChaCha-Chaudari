# Reproducibility (Windows 10/11 + PowerShell)

Prereqs:
- NVIDIA GPU + recent driver
- Docker Desktop with WSL2 + NVIDIA Container Toolkit
- Git

## 1) Clone and prepare
- Place Llama-2 7B chat weights in `backend/Llama-2-7b-chat-hf` (as in repo structure)
- Ensure `backend/Data/AnnualReport2023.pdf` exists (provided)
- Create `.env` in `backend/` with:
```
SECRET_KEY=change-me
ADMIN_CODE=letmein-admin
MONGODB_URI=mongodb://host.docker.internal:27017
MONGODB_DB=capstone_db
FRONTEND_URL=http://localhost:5173
AssistantVoice=en-US-JennyNeural
InputLanguage=en
```
- Start MongoDB locally (Docker or native)

## 2) Build backend image
```powershell
# From repo root
docker build -t capstone-backend:new .
```

## 3) Run backend with GPU
```powershell
# From repo root
$PWD = Get-Location

docker run --rm --gpus all `
  --name llama-chatbot `
  --ipc=host `
  --ulimit memlock=-1 `
  --ulimit stack=67108864 `
  -p 5001:5000 `
  -v "$PWD/backend/Data:/workspace/backend/Data" `
  -v "$PWD/backend/Llama-2-7b-chat-hf:/workspace/backend/Llama-2-7b-chat-hf:ro" `
  capstone-backend:new
```

Notes:
- If you hit Exit Code 1, check: model folder path, `.env` presence, MongoDB reachable, GPU visibility (`nvidia-smi` inside container).

## 4) Frontend (Vite)
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## 5) Testing
- Register/login via modal
- Ask a question; check `/llama-chat` in Network tab
- Click ``Speak`` (if implemented) to test `/tts` and audio playback

## 6) Troubleshooting
- CORS: ensure FRONTEND_URL matches dev server URL
- FAISS/embeddings: initial run builds index at backend start; ensure PDF readable
- TTS: voice requires internet (edge-tts uses MS TTS service); pick a supported voice
