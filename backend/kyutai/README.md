# Kyutai TTS model placement and usage

This app supports a separate TTS microservice (`tts_proxy.py`). By default it uses Piper. If you want to experiment with Kyutai's TTS 1.6B (English/French), place the model files here and run a Kyutai server separately, then point the proxy at it.

## Where to put the 4 files

Create this folder and copy your downloads into it:

```
backend/kyutai/tts-1.6b-en_fr/
  ├─ dsm_tts_1e68beda@240.safetensors      (~3.68 GB)
  ├─ tokenizer-e351c8d8-checkpoint125.safetensors  (~385 MB)
  ├─ tokenizer_spm_8k_en_fr_audio.model    (~120 KB)
  └─ config.json
```

You can use any folder name; just remember the absolute path for the Kyutai server you’ll run.

> Note: This model is en/fr only. For Hindi or Indian English now, use Piper voices instead.

## How to use these files (high-level)

1. Start a Kyutai TTS server locally (consult the Kyutai repo for the exact command). You will need to point it at the folder above. Example shape (pseudo-command):
   
   ```powershell
   # PSEUDO: Replace with the actual command from Kyutai docs
   kyutai-tts-server --model-dir "C:\Local-Disk D\Projects\capstone\backend\kyutai\tts-1.6b-en_fr" --port 7001
   ```

   After it starts, you should have a WebSocket or HTTP endpoint, e.g. `ws://localhost:7001/tts`.

2. Point our TTS proxy at Kyutai by setting environment variables before starting `tts_proxy.py`:
   
   ```powershell
   $env:TTS_BACKEND = "kyutai"
   $env:KYUTAI_WS_URL = "ws://localhost:7001/tts"   # adjust to your server URL
   python tts_proxy.py
   ```

   The proxy exposes `/speak` and `/tts` APIs on port 6001 by default. The frontend can call this service via `VITE_TTS_URL=http://localhost:6001`.

3. If you want to switch back to Piper later, just set:
   
   ```powershell
   $env:TTS_BACKEND = "piper"
   # (and set PIPER_PATH / PIPER_VOICES_DIR accordingly)
   python tts_proxy.py
   ```

## Frontend wiring

Set `VITE_TTS_URL` in `frontend/.env` to point the UI to this microservice:

```
VITE_TTS_URL=http://localhost:6001
```

The chat will continue to use the main backend for LLM/RAG but will fetch audio from this TTS service.

## Tips

- Keep these large files out of git (they're not committed by default). 
- If you need Hindi/Indian English right now, Piper voices are recommended and already integrated.
- This README is a convenience guide; always follow the Kyutai repo instructions for the exact server startup commands.
