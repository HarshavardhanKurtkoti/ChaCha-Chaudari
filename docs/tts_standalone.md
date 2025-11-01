# Standalone TTS Service (Windows)

You can run Text-to-Speech as a separate microservice and keep the main backend focused on chat/RAG.

This repo already includes `backend/tts_server.py`, a small Flask app that serves `/tts`, `/voices`, and `/health`.

## Why
- Faster startup and simpler troubleshooting
- Swap engines or voices without touching the main API
- Scale/chat and TTS independently if needed

## Folder layout
```
backend/
  tts_server.py        # standalone service
  piper/               # put piper.exe here (Windows)
  voices/
    piper/             # put voice .onnx + .json pairs here
```

## Setup (once)
1) Download Piper for Windows (piper.exe) and place it at:
```
backend\piper\piper.exe
```
2) Download a Piper voice (recommend: a Hindi `hi-IN` or an Indian English `en-IN` voice).
   Put the two files in:
```
backend\voices\piper\<voice>.onnx
backend\voices\piper\<voice>.json
```
3) Create `backend/.env`:
```
FRONTEND_URL=http://localhost:5173
PIPER_PATH=C:\Local-Disk D\Projects\capstone\backend\piper\piper.exe
```

## Run the standalone TTS server
Open a PowerShell terminal:
```powershell
cd backend
$env:FLASK_ENV = "production"
$env:PORT = "5001"    # optional; defaults to 5001
python tts_server.py
```
This exposes:
- http://localhost:5001/tts
- http://localhost:5001/voices
- http://localhost:5001/health

## Point the frontend to it
Set `VITE_TTS_BASE_URL` in `frontend/.env` (or your Vercel env) to the TTS server URL:
```
VITE_TTS_BASE_URL=http://localhost:5001
```
Then run the frontend as usual (`npm run dev`). In production, set the env variable to your deployed TTS URL.

Notes
- If `VITE_TTS_BASE_URL` is not set, the UI will fall back to the main API base for `/tts`.
- `/tts` accepts JSON `{ text, voice?, lang? }` and returns `audio/wav`.
- Use `/voices` to list available Piper voices detected in `backend/voices/piper`.
