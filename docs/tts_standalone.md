# Standalone TTS Service (Windows & Linux)

You can run Text-to-Speech as a dedicated microservice (`tts_proxy.py`) running on port 6001 and keep the main backend focused on LLM chat and RAG retrieval.

## Features
- Low-latency streaming audio synthesis decoupled from LLM inference
- Native offline Piper ONNX execution for Indian English (`en_IN`) and Hindi (`hi_IN`)
- Automatic fallback cascade: Piper ONNX -> gTTS / Edge-TTS -> Pyttsx3 / Mock
- Multi-engine proxy support (`piper`, `pocket-piper`, `kyutai`)

## Folder Layout
```
backend/
  tts_proxy.py         # standalone service (port 6001)
  piper/               # put piper.exe here (Windows)
  voices/
    piper/             # put voice .onnx + .json pairs here
```

## Setup (once)
1) Download Piper binary for your OS and place it at:
   - Windows: `backend\piper\piper.exe`
   - Linux: `/usr/local/bin/piper` or `backend/piper/piper`
2) Download a Piper voice (recommended: Hindi `hi_IN` or Indian English `en_IN`).
   Put the two files in:
   - `backend/voices/piper/<voice>.onnx`
   - `backend/voices/piper/<voice>.json`

## Running the Standalone TTS Proxy
Open a terminal in `backend`:
```powershell
python tts_proxy.py --engine piper --port 6001
```
Or run the pre-configured script from the repository root:
```powershell
.\scripts\start_tts_proxy_piper.ps1
```

This exposes:
- `http://localhost:6001/tts` (POST JSON `{ "text": "...", "voice": "...", "lang": "..." }`)
- `http://localhost:6001/fast-tts` (POST/GET ultra-fast synthesis)
- `http://localhost:6001/voices` (GET available local and fallback voices)
- `http://localhost:6001/health` (GET operational status and active engine)

## Pointing the Frontend to the TTS Proxy
Set `VITE_TTS_BASE_URL` in `frontend/.env`:
```env
VITE_TTS_BASE_URL=http://localhost:6001
```
If `VITE_TTS_BASE_URL` is omitted, the frontend automatically falls back to `VITE_API_BASE_URL` (`http://localhost:5000/tts` or `/api/tts`), which routes through the backend's unified speech controller.
