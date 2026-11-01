# ChaCha-Chaudari Comprehensive Repair & Hardening Plan

**Project:** ChaCha-Chaudari / SmartGanga Mascot  
**Target:** Turn current prototype into a clean, stable, demo-ready, production-quality full-stack application.  
**Date:** November 2026

---

## 1. Baseline Architectural Overview

- **Frontend:**
  - React 18.2 + Vite 4.4 + Tailwind CSS 3.3 + Mantine 6.x + Framer Motion + Three.js / R3F / Drei.
  - State management: React Context (`MessageProvider`, `BotStateContext`, `SettingsContext`, `AuthUIContext`) + localStorage.
  - Routing: React Router v6 with page transitions via Framer Motion.
  - Testing: Vitest (2 test suites passing initially).
  - Linting: ESLint (67 warnings/errors initially due to unused vars, CommonJS script in src, prop types).

- **Backend:**
  - Python 3.10+ / Flask 3.1.2 + flask-cors + PyJWT + bcrypt.
  - LLM: HuggingFace Transformers (Phi-3-mini-4k-instruct / Llama-2-7B fallback).
  - Embeddings & Vector Search: SentenceTransformer (`all-MiniLM-L6-v2`) / deterministic hash embedding fallback + FAISS / cosine similarity numpy shim.
  - TTS: Piper TTS (.exe subprocess, offline Indian English/Hindi models) with fallbacks (gTTS, edge-tts, pyttsx3). Standalone proxy on port 6001 (`tts_proxy.py`).
  - Database: MongoDB (PyMongo) with transparent in-memory dict collection fallback.

---

## 2. Issues Inventory & Action Plan

| ID | Component | Issue | Severity | Proposed Solution | Verification |
|---|---|---|---|---|---|
| **ISS-01** | Frontend Components | Empty/stub files: `TiltCard.jsx`, `CarouselsReco.jsx`, `Achievements.jsx`, `CarouselCard.jsx`, `ConfettiCanvas.jsx`, `ParallaxLayer.jsx`, `StarfieldLayer.jsx`, `Home_temp.jsx`, `context/index.js`, `styles/parallax.css` | High | Implement real components for active ones (`TiltCard`, `CarouselsReco`, `Achievements`, `ConfettiCanvas`, `ParallaxLayer`), clean up unused stubs safely. | `npm run build`, page visual check |
| **ISS-02** | Frontend API Config | Hardcoded URLs (`http://127.0.0.1:6001`, `http://localhost:1212`, `http://localhost:5000`) in `ChatBot.jsx`, `Navigation.jsx`, `SettingsPanel.jsx` | High | Centralize in `src/config/api.js` using `VITE_API_BASE_URL` and `VITE_TTS_BASE_URL`. | Grep for localhost; verify API calls route through config |
| **ISS-03** | Frontend Auth | Fragile window event listeners (`user-logged-in`, `user-logged-out`, `profile-updated`) | Medium | Refactor `AuthContext` to expose `user`, `login`, `logout`, `updateUser`, `isAuthenticated` cleanly. | Login, logout, profile update tests |
| **ISS-04** | Error Handling & 404 | No React Error Boundary; no 404 route; API failures crash or go blank | High | Add `ErrorBoundary.jsx`, `NotFound.jsx`, and graceful error states. | Render invalid route, trigger simulated error |
| **ISS-05** | 3D Avatar | `Bot.jsx` GLTF loading lacks robust loading skeleton and fallback on WebGL failure | Medium | Add Suspense fallback with `<SkullLoader />`, WebGL detection and 2D avatar fallback. | Emulate slow 3D loading, verify smooth rendering |
| **ISS-06** | Chat UX & STT | NDJSON stream parser needs hardened error handling; browser STT needs permission & browser support fallbacks | High | Harden stream parsing, handle malformed chunks and network drops; add STT error notifications. | Run streaming chat simulation, toggle mic permissions |
| **ISS-07** | Hindi Translation | Backend comments claim translation, but runtime was stubbed | Medium | Create `TranslationService` abstraction with local dictionary/rule fallbacks and Bhashini provider interface. | Test Hindi prompt flow and response generation |
| **ISS-08** | Navigation Endpoint | `Navigation.jsx` calls `/api/updateLocation` which does not exist on backend | Medium | Implement validated `/updateLocation` endpoint in backend with sanitization and user privacy. | POST `/updateLocation` returning 200 JSON |
| **ISS-09** | Monolithic `app.py` | 3,817 lines with ~1,450 lines of duplicate disabled code (`create_app_legacy_disabled`) | Critical | Modularize into `services/` (llm, rag, tts, translation), `routes/` (chat, speech), clean entry point `app.py`. | Backend imports cleanly, endpoints respond |
| **ISS-10** | RAG Import Side-Effect | `rag_utils.py` synchronously parses 19MB PDF on module import if index is missing | Critical | Decouple module import from index building; make RAG service lazy and cached. | Immediate `import rag_utils` without delay |
| **ISS-11** | Gamification Persistence | 100% localStorage; no backend storage, no server verification, spoofable scores | High | Implement `game_routes.py` with `/game/progress`, `/game/score`, `/game/daily-reward`, `/game/leaderboard` backed by MongoDB with atomic updates. | Unit tests for game routes, daily reward once-per-day enforcement |
| **ISS-12** | Dead Code & Debug Files | `data.py` (0B), `test_tts_hi.py` (0B), `headers.txt`, `resp.json`, obsolete `tts_server.py` | Low | Verify no imports or build scripts reference them, then remove cleanly. | Verify clean git status and builds |
| **ISS-13** | Docker & Deployment | Dockerfile only packages backend with no compose, no frontend, no env wiring | Medium | Create unified `docker-compose.yml` with backend, tts, mongodb, and frontend services. | Compose syntax validation and config check |
| **ISS-14** | Testing & CI | No backend tests, no CI workflows, no automated checks | High | Add comprehensive pytest suite for auth, game, chat, tts, location; add GitHub Actions CI. | `pytest` and `vitest` pass in CI |

---

## 3. Step-by-Step Implementation Checkpoints

### Checkpoint 1: Audit + Baseline + Repair Plan (Current)
- Completed inspection of frontend and backend.
- Set up backend virtual environment with Python 3.13 and dependencies.
- Documented baseline test and build status.
- Generated this `docs/REPAIR_PLAN.md`.

### Checkpoint 2: Frontend Broken Components & API Configuration
- Implement `src/config/api.js`.
- Remove hardcoded URLs from `ChatBot.jsx`, `SettingsPanel.jsx`, `Navigation.jsx`.
- Implement `TiltCard.jsx`, `CarouselsReco.jsx`, `Achievements.jsx`, `ConfettiCanvas.jsx`, `ParallaxLayer.jsx`.
- Safely clean unused files (`StarfieldLayer.jsx`, `Home_temp.jsx`, `CarouselCard.jsx`, `context/index.js`, `add_tamil_translations.js`).
- Verify `npm run build`.

### Checkpoint 3: Frontend Auth, Error Handling, Chat, TTS, STT
- Create unified `AuthContext` with login/logout/user state.
- Create `ErrorBoundary` and `NotFound` (404) page.
- Harden NDJSON streaming in `ChatBot.jsx`.
- Verify TTS proxy connectivity and fallback notifications.
- Ensure browser STT has graceful fallbacks for microphone permission denial.

### Checkpoint 4: Frontend Responsive UI, Accessibility, 3D Avatar, Gamification
- Add `<Suspense>` and 2D fallback to `Bot.jsx`.
- Fix responsive layout issues (YouTube embed fixed width, mobile padding).
- Enhance accessibility (aria-labels, keyboard focus states).
- Connect gamification UI to backend API with optimistic localStorage fallback.

### Checkpoint 5: Backend Modularization
- Create `backend/config.py` with environment validation.
- Create `backend/services/` (`llm_service.py`, `rag_service.py`, `tts_service.py`, `translation_service.py`).
- Create `backend/routes/` (`chat.py`, `speech.py`).
- Eliminate duplicate legacy code in `app.py`.
- Ensure lazy loading of models and indices.

### Checkpoint 6: Gamification Backend & Security Hardening
- Implement `backend/game_routes.py` with server-side validation.
- Atomic streak updates and daily reward enforcement.
- Security audit: sanitize inputs, prevent shell injection in Piper, protect JWT and CORS.
- Implement `/updateLocation` route.

### Checkpoint 7: Docker, Configuration & Tests
- Create `docker-compose.yml` with backend, tts, mongodb, frontend.
- Add backend test suite with `pytest`.
- Add frontend tests with `vitest`.
- Add GitHub Actions CI workflow (`.github/workflows/ci.yml`).

### Checkpoint 8: Final QA & Documentation
- Full end-to-end audit (Auth, Chat, RAG, TTS, Games, Leaderboard, Map).
- Update `README.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DEVELOPMENT.md`, `docs/TROUBLESHOOTING.md`.
- Generate `FINAL_CHANGELOG.md` and `FINAL_STATUS.md`.

