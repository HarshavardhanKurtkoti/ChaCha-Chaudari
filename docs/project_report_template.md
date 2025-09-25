# Project Report: SmartGanga Mascot — AI/ML and RAG-Powered Robot and Digital Avatar

This is a comprehensive report template customized to your repository. Fill in institution-specific and results sections as applicable.

## 1. Title Page
- Title: SmartGanga Mascot: AI/ML and RAG-Powered Robot and Digital Avatar for River–People Connect in Namami Gange
- Team members, guide/supervisor, department, institute, academic year

## 2. Abstract
Provide a concise summary: goals, methods (Llama-2 + FAISS RAG + Flask + React), and outcomes (latency, usability, accuracy).

## 3. Introduction
- Background: Namami Gange, public engagement needs.
- Objectives: informative, responsive, accessible chatbot; offline/on-prem deployment; voice I/O.
- Scope: museum kiosk, web avatar.

## 4. Literature Survey / Related Work
- RAG frameworks and domain adaptation
- Edge hosting of LLMs, privacy-preserving chat agents
- Conversational interfaces in education/museums

## 5. Requirements Analysis
### 5.1 Functional Requirements
- User registration and login (JWT)
- Ask questions about riverine ecology and Namami Gange materials
- Retrieve relevant document context and generate answers
- Persist chat histories per user; admin stats
- TTS playback; browser STT to send transcripts

### 5.2 Non-Functional Requirements
- Latency target: < 2–4 s per answer on GPU
- Availability: kiosk uptime; recover on failure
- Security: password hashing; JWT with expiry; CORS
- Privacy: no cloud LLM calls; data stored locally

## 6. System Design
### 6.1 Architecture
- React frontend ↔ Flask backend ↔ Llama-2 + FAISS + MongoDB
- Diagram and sequence flows for: register/login, chat with RAG, TTS

### 6.2 Module Design
- Frontend: pages, providers, speech, auth modal
- Backend: auth blueprint, chats blueprint, RAG utilities, TTS service, app factory
- Data: PDF ingestion, chunking, FAISS index, Mongo collections

### 6.3 Data Model
- Users: {name, email, password_hash, is_admin, created}
- Chats: {id, user_email, title, messages[], created, updated}

## 7. Technologies Used
### 7.1 Backend
- Python 3.10+; Flask 3.x; flask-cors
- Transformers 4.56; torch 2.5; AutoModelForCausalLM
- FAISS-cpu 1.12; pdfplumber 0.11; numpy/pandas
- edge-tts for speech; PyJWT; Werkzeug security
- MongoDB (pymongo 4.9) for persistence

### 7.2 Frontend
- React 18; Vite; Mantine UI; React Router
- TailwindCSS; react-markdown; axios
- react-speech-recognition; Bhashini SDK for multilingual support

### 7.3 DevOps/Deployment
- Docker (NVIDIA CUDA base image); GPU passthrough; volume mounts
- .env configuration: SECRET_KEY, ADMIN_CODE, MONGODB_URI, FRONTEND_URL, AssistantVoice, InputLanguage

## 8. Implementation
### 8.1 RAG Pipeline
- Ingestion: `pdfplumber` to extract text from `Data/AnnualReport2023.pdf`
- Chunking: 500-token windows
- Embedding: placeholder hash embeddings (explain limitation) with drop-in upgrade path to `sentence-transformers`
- Index: FAISS IndexFlatL2; top-k=3 retrieval
- Prompting: context injection with guardrail to admit uncertainty

### 8.2 Model Inference
- Llama-2 7B chat weights mounted locally under `backend/Llama-2-7b-chat-hf`
- Tokenization via `AutoTokenizer`; generation with `AutoModelForCausalLM.generate`
- Parameters: max_new_tokens=128, temperature=0.2, device_map="auto"

### 8.3 REST API Endpoints
- `/auth/register`, `/auth/login`, `/auth/me`
- `/chats/` (list), `/chats/save`, `/chats/{id}` (delete), `/chats/delete_all`, admin variants
- `/llama-chat` for RAG QA; `/tts` for audio; `/stt` echo transcript

### 8.4 Frontend Flows
- Login/Signup modal storing JWT; attach Authorization header for protected calls
- Chat UI: compose message, call `/llama-chat`, render markdown
- Voice: call `/tts` to stream audio, play via HTMLAudioElement; STT via browser

### 8.5 Security and Privacy
- Password hashing; JWT expiry; CORS origin control
- Local-only model execution; no third-party LLM APIs

## 9. Testing and Evaluation
- Unit tests (where applicable); manual verification steps
- Benchmark plan: latency, memory; retrieval hit-rate; user feedback
- Sample test cases and expected/observed outcomes

## 10. Results
- Include screenshots of UI, logs, example answers
- Tables/graphs for metrics

## 11. Deployment Guide (Reproducibility)
- Build image from repo root using provided Dockerfile
- Run container with GPU and bind mounts for `backend/Data` and model dir
- Start frontend via `npm run dev` (Vite)
- Example .env

## 12. Limitations and Future Work
- Replace hash embeddings with sentence-transformers; add reranking
- Streamed token outputs; multilingual voices; better STT UX
- Multi-document ingestion and admin CMS

## 13. Conclusion
- Summarize learnings and impact

## 14. References
- Cite the core tools and prior work
