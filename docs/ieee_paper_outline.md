# IEEE Paper Outline: SmartGanga Mascot (AI/ML + RAG Chatbot and Voice Assistant)

This outline is tailored to the current repository and can be pasted into an IEEE conference template (two-column format).

## Title
SmartGanga Mascot: An AI/ML and RAG-Powered Robot and Digital Avatar for River–People Connect in Namami Gange

## Authors and Affiliation
- <Your Name(s)>
- <Institution/Department>
- <City, Country>
- Contact: <email>

## Abstract
We present an on-device, retrieval-augmented generation (RAG) chatbot and voice assistant designed as the digital avatar of “Chacha Chaudhary,” the official mascot of the Namami Gange Programme. The system couples a local Llama-2 7B chat model with a lightweight document retrieval pipeline built over FAISS. A React-based web front-end offers multimodal interaction, including text, speech-to-text (STT), and text-to-speech (TTS). The backend exposes REST APIs using Flask and integrates user authentication and chat persistence via MongoDB. We detail the architecture, implementation choices, optimizations for edge deployment (quantization-ready model artifacts, GPU containers), and evaluate the system using response relevance, latency, and user study metrics in a museum-style kiosk scenario. The approach demonstrates a practical, privacy-preserving RAG pipeline for domain outreach.

## Keywords
RAG, LLM, Llama-2, FAISS, Flask, React, Edge AI, Speech Synthesis, MongoDB, Human-Computer Interaction

## 1. Introduction
- Motivation: engaging the public on riverine ecology through an approachable mascot; need for reliable domain answers, low latency, and offline capability.
- Challenge: balancing accuracy (domain-grounded answers) with privacy and compute constraints in kiosks.
- Contribution:
  1) An end-to-end, locally hosted RAG chatbot centered on Llama-2 7B chat.
  2) A pragmatic retrieval pipeline with FAISS and chunked PDF ingestion.
  3) A web UI with TTS/STT and JWT-authenticated, persistent chat histories.
  4) Deployment via CUDA-enabled Docker for reproducible GPU inference.

## 2. Related Work
- RAG for domain adaptation of general LLMs.
- Edge/on-prem hosting of LLMs and privacy-preserving chatbots.
- Educational kiosks and conversational agents for museums/outreach.

## 3. System Architecture
- Overview diagram: Browser (React + Mantine + Tailwind) <-> Flask API <-> Llama-2 model + FAISS index + MongoDB.
- Data flow: ingestion (PDF → chunks → embeddings → FAISS), query (user → retrieval → prompt assembly → generation → response), voice (text→speech via edge-tts; optional browser STT).

### 3.1 Frontend
- Stack: React 18, Vite, Mantine UI, React Router, Tailwind, react-markdown.
- Speech: react-speech-recognition (browser Web Speech API) and audio playback for TTS endpoint.
- Auth: login/signup flows calling /auth endpoints, token stored in localStorage, protected routes.

### 3.2 Backend
- Framework: Flask 3.x with flask-cors.
- Auth: JWT with PyJWT, password hashing via Werkzeug.
- Chat persistence: MongoDB (users, chats), indexes on email and (user_email,id).
- RAG: pdfplumber for PDF parsing; chunking; embeddings + FAISS index; context injection into prompts.
- LLM: Hugging Face transformers AutoModelForCausalLM; local model assets in backend/Llama-2-7b-chat-hf; GPU inference when available.
- TTS: edge-tts with unique mp3 file generation per request, returned as audio/mpeg stream.

### 3.3 Data Layer
- Documents: example AnnualReport2023.pdf under backend/Data.
- Indexing: FAISS IndexFlatL2; example hash embeddings (replaceable by sentence-transformers model for production).

### 3.4 Deployment
- Docker: NVIDIA PyTorch base image, CUDA support, pip deps pinned; environment flags to avoid audio/numba conflicts.
- Runtime: container exposes port 5000; volumes mount Data and model weights; optional --gpus=all.

## 4. Implementation Details
- Prompt assembly: truncate question/context to avoid overlong inputs; instruct model to admit uncertainty when context is missing.
- Safety/robustness: input validation; exception handling around PDF, TTS, and generation; CORS restricted via FRONTEND_URL when defined.
- Performance: use of device_map="auto"; quantized artifacts optional via GPTQ/GGUF; top-k retrieval; temperature sampling tuned (0.2).
- Extensibility: swap-in production-grade embeddings (e.g., sentence-transformers/all-MiniLM-L6-v2), add rerankers, and streaming token APIs.

## 5. Evaluation
- Offline metrics: retrieval hit-rate@k using a set of Q/A derived from the PDF; average generation latency on a single A100/RTX GPU; memory footprint under Docker.
- User study: SUS or Likert-scale feedback from visitors; task success rates for guided information finding.
- Ablation: hash vs sentence-transformers embeddings; with/without RAG context.

## 6. Results
- Summarize qualitative examples and quantitative tables: latency, accuracy, user ratings.
- Error analysis: failure cases when context absent or ambiguous; speech pipeline robustness.

## 7. Discussion
- Trade-offs of local hosting vs cloud LLM APIs.
- Ethical considerations and privacy (no chat data leaves device; opt-in telemetry).
- Accessibility and multilingual support via Bhashini and TTS voices.

## 8. Conclusion and Future Work
- Contributions recapped; planned upgrades: better embeddings, reranking, streaming UI, multi-doc ingestion, improved voice UX, and analytics dashboard.

## Acknowledgments
- NMCG and Diamond Toons context; institutional support.

## References
- Cite RAG, FAISS, Llama-2, Flask, React, MongoDB, edge-tts, pdfplumber, sentence-transformers.
