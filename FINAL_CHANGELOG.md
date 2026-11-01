# ChaCha-Chaudari (SmartGanga Mascot) — Final Changelog

All changes implemented across Checkpoints 1 through 8, followed by the **V2 Production-Ready Design & OpenRouter GPT-4o** overhaul.

---

## [2.1.0] - 2026-11-01 (V2 Production Redesign & Cloud LLM)

### 1. OpenRouter GPT-4o Cloud LLM Switch
- Integrated OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) with OpenAI `gpt-4o`.
- Added dynamic environment switch in `backend/config.py` (`LLM_PROVIDER=openrouter` vs `local`).
- Implemented real-time token streaming via OpenRouter Server-Sent Events (SSE) in `backend/services/llm_service.py`.
- Preserved zero-latency fallback to offline rule-based mascot personas and local PyTorch transformers.

### 2. Complete V2 UI Design Overhaul
- **Design Inspiration:** Drawn directly from [ThreeUI](https://threeui.com/browse), [TasteSkill](https://www.tasteskill.dev/), [GSAP](https://gsap.com/), and [21st.dev](https://21st.dev/).
- **Installed Modern Libraries:** Added `gsap` and `lucide-react`.
- **Enhanced Design Tokens:** Extended `frontend/tailwind.config.js` and `frontend/src/index.css` with dark cyber-organic palette (`surface-950`, `ganga-blue`, `sacred-gold`), custom glow shadows, glassmorphism utilities (`.bento-card`, `.glass-panel`, `.glass-pill`), and smooth scrollbars.
- **Floating Pill Navigation (`NavBar.jsx`):** Redesigned with backdrop-blur-xl, live status indicator ("SmartGanga v2.0 • Online"), active link underlines, quick "Ask Chacha" pulse button, and instant Hindi/English language toggle.
- **High-Impact Landing Hub (`Home.jsx`):**
  - Editorial hero typography ("The Living Spirit of River Ganga, Reimagined").
  - 3D Holographic Pedestal Viewport with ambient floor glow and live avatar stream status.
  - Real-time Namami Gange stats ticker (2,525 km length, 140+ species, ₹20,000 Cr outlay, 5 states).
  - 4-Pillar Bento Grid: Conversational AI & RAG, Sacred Ghats Radar, River Basin War Room, and Eco-Quests.
  - Quick-prompt launcher chips routing directly into chat with pre-filled state.
- **Sacred Ghats & Navigation Radar (`Navigation.jsx`):**
  - Haversine geodesic distance calculator to Dashashwamedh Ghat (Varanasi Aarti).
  - Dark mode cartography view with OpenStreetMap embed.
- **River Basin War Room & Museum (`WarRoom_museum.jsx`):**
  - 3D tilt cards with image loading skeletons.
  - Key institutional highlights (NMCG & WII Dehradun).
  - Structured visiting hours schedule table.
- **Riverine Ecology Explorer (`RiverineEcology.jsx`):**
  - Hydro-ecological catchment area statistics.
  - Flagship riverine species carousel (Gangetic Dolphin, Gharial, Golden Mahseer).
- **Gamification & Quests Hub (`Games.jsx`):**
  - Bento quest cards for Ecology Quiz, Ghats Waste Sorting, and Stream Cleanup.
  - Streak multipliers, badge unlock showcase, and real-time leaderboard.
- **Hardened Chat View (`Chat.jsx` & `ChatBot.jsx`):**
  - Integrated into the dark surface theme with pre-filled prompt support from the landing page.

---

## [2.0.0] - 2026-11-01 (Baseline Modularization & Testing)
- Established clean Python 3.13 virtual environment and fixed package resolution.
- Centralized all URLs into `src/config/api.js`.
- Implemented `TiltCard.jsx`, `ParallaxLayer.jsx`, `CarouselsReco.jsx`, `Achievements.jsx`, `ConfettiCanvas.jsx`.
- Cleaned dead stubs without breaking routes.
- Built `AuthContext.jsx` with token expiration detection.
- Added global `ErrorBoundary.jsx` and `NotFound.jsx` 404 route.
- Modularized backend into `llm_service.py`, `rag_service.py`, `translation_service.py`, `tts_service.py`, `game_routes.py`.
- Automated tests: 24/24 backend pytest tests passing; 7/7 frontend vitest tests passing.
- Added `docker-compose.yml`, `frontend/Dockerfile`, `nginx.conf`, and `.github/workflows/ci.yml`.
