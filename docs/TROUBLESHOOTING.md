# SmartGanga Mascot — Troubleshooting & FAQ

## 1. 3D Avatar Fallback & WebGL Issues

### Issue: "WebGL context lost" or Black Screen on Bot page
- **Cause:** Older graphics drivers, integrated GPUs under memory pressure, or browser hardware acceleration disabled.
- **Solution:** The application automatically detects WebGL capabilities. If WebGL is unavailable or fails, it activates a 2D illustrated avatar fallback (`Lspeaking-bg.png` and `chacha.webp`) with mouth animation synced to speech.

---

## 2. Audio & Speech Synthesis (TTS)

### Issue: No audio plays when Chacha answers
- **Cause:** Browser audio autoplay policy blocks unprompted audio generation before user interaction.
- **Solution:** Click anywhere on the page or tap the audio unmute toggle button in the bottom right corner of the chat window.

### Issue: Piper TTS model not found
- **Cause:** Piper ONNX binary or voice models are not downloaded locally.
- **Solution:**
  1. The backend automatically cascades to gTTS / Edge-TTS / Pyttsx3 fallback engines.
  2. To install offline Piper voices on Windows:
     ```powershell
     .\scripts\download_piper_voice.ps1
     ```

---

## 3. Database & Persistence

### Issue: MongoDB is not running locally
- **Behavior:** The backend automatically falls back to an internal thread-safe in-memory database (`_InMemoryCollection`).
- **Log Message:** `MongoDB not available at mongodb://localhost:27017/chachadb; falling back to in-memory store`.
- **Note:** In-memory mode allows full registration, login, chat persistence, and gamification during demos or testing without requiring a running MongoDB daemon.

---

## 4. API & CORS

### Issue: "Cross-Origin Request Blocked" in browser console
- **Cause:** Frontend port differs from allowed origins in `backend/.env`.
- **Solution:** Add your frontend origin (e.g. `http://localhost:5173`) to `CORS_ORIGINS` in `backend/.env`:
  ```env
  CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:80
  ```

