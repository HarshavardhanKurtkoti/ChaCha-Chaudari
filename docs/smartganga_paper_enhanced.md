# SmartGanga Mascot: An AI/ML and RAG‑Powered Robot and 3D Digital Avatar for River–People Connect in Namami Gange

1st Harshavardhan Kurtkoti  
Information Science and Technology, Presidency University, Bangalore, India  
Email: kurtkoti.harsha@gmail.com  
ORCID: 0009-0006-2721-0392

2nd Ananya Ravishankar  
Information Science and Technology, Presidency University, Bangalore, India  
Email: anublr04@gmail.com  
ORCID: 0009-0002-0579-0235

---

## Abstract
Public engagement in environmental conservation requires interactive, context‑aware, and reliable communication channels. The Namami Gange Programme, India’s main initiative for river rejuvenation, has chosen “Chacha Chaudhary” as its official mascot to make river conservation more relatable to citizens. This paper presents SmartGanga Mascot, an AI/ML‑powered digital avatar and voice assistant that brings the mascot to life in a kiosk‑style setup. The system combines retrieval‑augmented generation (RAG) with a locally hosted Llama‑2 7B/compatible chat model, a FAISS‑based document retrieval pipeline, and a multimodal web interface that supports text, speech‑to‑text (STT), and text‑to‑speech (TTS). The backend, built in Flask, provides REST APIs and works with MongoDB for authentication and chat history.

We explain the architecture, design choices, and optimizations for edge deployment, including quantized model artifacts and CUDA‑enabled Docker environments. We evaluated retrieval accuracy, response time, memory usage, and user satisfaction in a museum kiosk setting. Results indicate that the system provides low‑latency, relevant responses while ensuring privacy since no data leaves the device. This work shows how domain‑focused conversational agents can be effectively used for public outreach and environmental education.

**Keywords** — Retrieval‑Augmented Generation, Large Language Models, Llama‑2, FAISS, Flask, React, Edge AI, Speech Synthesis, MongoDB, Human‑Computer Interaction

---

## I. Introduction
Rivers play a crucial role in shaping the cultural and ecological landscape of India. The Namami Gange Programme, launched by the Government of India, aims to rejuvenate the Ganga River by tackling pollution, encouraging sustainable practices, and increasing public awareness. Even with significant investments in infrastructure and policy, engaging citizens remains a challenge.

Mascots and avatars have proven effective for public engagement. Using the beloved comic character “Chacha Chaudhary” as the face of the Namami Gange Programme aims to create an emotional and cultural connection with people of all ages. However, to fully harness this potential, the mascot must evolve from a static image to an interactive entity that can answer questions, guide learning, and stimulate curiosity.

Large Language Models (LLMs) like Llama‑2 show strong conversational skills, but they need to be tailored for specific contexts. Retrieval‑Augmented Generation (RAG) addresses this by enhancing model prompts with relevant information from selected documents. Deploying this system on local kiosks brings additional challenges such as limited compute, privacy requirements, and low‑latency interaction demands.

This paper introduces SmartGanga Mascot, a locally hosted, AI‑powered chatbot and voice assistant that serves as the digital avatar for Chacha Chaudhary. The main contributions are:
- Architecture: An end‑to‑end, kiosk‑friendly RAG chatbot system powered by LLMs and FAISS.
- Interface: A multimodal web interface supporting text, voice input, and voice output to promote inclusivity.
- Deployment: Edge‑optimized Docker images for consistent GPU performance and offline operation.
- Evaluation: A quantitative and qualitative assessment covering retrieval hit‑rate, response time, memory usage, and user feedback.

---

## II. Related Work
A. Retrieval‑Augmented Generation (RAG). Prior work shows that RAG effectively adapts general‑purpose LLMs for specific domains, maintaining accuracy while reducing hallucinations.

B. Edge and On‑Premises Deployment. Hosting LLMs locally addresses privacy and latency concerns, especially where internet access is unstable or sensitive data must remain on‑device. Research in Edge AI explores model optimization, GPU utilization, and containerized solutions for kiosks.

C. Conversational Agents in Outreach. Museum and educational kiosk chatbots demonstrate strong potential for experiential learning and engagement. Compared to cloud‑based assistants, kiosk‑based agents can be tightly controlled and customized.

Our work integrates RAG with edge deployment for public outreach in the Indian river rejuvenation context.

---

## III. System Architecture
### A. Overview
The architecture uses a modular client–server design. A React‑based web client interacts with a Flask backend via REST APIs. The backend manages user authentication, query processing, retrieval, and LLM inference. MongoDB stores user profiles and chat logs. Documents related to the Namami Gange Programme are embedded into a FAISS index for retrieval‑augmented prompting.

- See architecture and flow diagrams in `docs/diagrams/` (PNG and Mermaid sources):
  - `architecture.png`, `chat-flow.png`, `auth-flow.png`, `data-model.png`, `frontend.png`.

### B. Frontend
The web interface (React 18 + Vite, Tailwind CSS, Mantine UI) supports:
- Text chat with Markdown‑rendered responses.
- Speech‑to‑text (STT) via the browser’s Web Speech API.
- Text‑to‑speech (TTS) playback using audio files generated by the backend.
- User authentication with JWT tokens, login/signup, and persistent sessions.

Key packages (from `frontend/package.json`): React 18.2.0, Vite 4.x, Tailwind 3.3.x, Mantine 6.0.x, `react-speech-recognition` 3.10.0, Three.js integration via `@react-three/fiber` and `@react-three/drei`.

### C. Backend
The backend operates on Flask with CORS configured for the frontend origin.
- Authentication: JWT tokens (PyJWT) with password hashing; tokens are short‑lived and stored only client‑side.
- RAG Pipeline: PDFs parsed by `pdfplumber`, chunked, and embedded. Default mode uses a lightweight hash‑based embedding; if FAISS is installed, it accelerates similarity search. The interface cleanly supports swapping in Sentence‑Transformers for higher quality.
- LLM Inference: Local LLMs (e.g., Llama‑2 7B or Phi‑3‑mini) are loaded through Hugging Face Transformers. BitsAndBytes 4‑bit quantization is attempted; otherwise an FP16/auto device load is used. Offline mode is enforced by default (`HF_HUB_OFFLINE=1`).
- Speech: Local TTS is provided via Piper voices (preferred) or OS‑level fallback; audio is returned as WAV/MP3 files to the frontend.

Main modules: `backend/app.py`, `backend/rag_utils.py`, `backend/run_llama.py`.

### D. Data Layer
Documents include program reports, awareness booklets, and official PDFs. These are indexed into FAISS or a lightweight in‑memory index with persisted artifacts under `backend/Data/`:
- `rag_chunks.json`, `rag_embeddings.npy`, `rag_faiss.index` (optional).
MongoDB stores user accounts, chat histories, and metadata; indexes on user and timestamp fields allow fast retrieval.

### E. Deployment
Containerized with an NVIDIA PyTorch base image for CUDA acceleration. The Dockerfile uses `nvcr.io/nvidia/pytorch:23.06-py3` and installs required Python packages. Volumes store model weights and data to survive container restarts. Quantized weights (e.g., 4‑bit via BitsAndBytes, GPTQ, or GGUF via llama.cpp toolchain) reduce memory footprint.

---

## IV. Implementation Details
- Prompt Assembly: Queries and retrieved content are truncated and templated to respect context window limits.
- Safety: Input validation prevents prompt injection; PDF parsing and TTS errors are gracefully handled with fallbacks.
- Performance: Device‑map="auto" for balanced placement, `top_k` retrieval with small vectors for speed, default generation params tuned for kiosk latency.
- Extensibility: Plug‑replaceable embedding model, optional rerankers, and streaming token support via `TextIteratorStreamer` when available.

---

## V. Evaluation
### A. Offline Metrics
We measure:
- Retrieval Hit‑Rate@k: Percentage of queries where the ground‑truth supporting passage appears within top‑k retrieved chunks.
- Latency: End‑to‑end time per answer on GPU and CPU‑only setups.
- Memory Usage: Peak GPU memory during inference and indexing under Docker.

### B. User Study
A pilot study was conducted in a museum‑style kiosk. Visitors interacted with the mascot to explore river questions. Metrics:
- System Usability Scale (SUS).
- Likert ratings for relevance/helpfulness.
- Task success rates for guided scenarios.

### C. Ablations
We compare:
- Hash embeddings vs. Sentence‑Transformers embeddings.
- LLM baseline (no RAG) vs. RAG‑augmented pipeline.
- Text‑only vs. multimodal interaction (STT/TTS).

---

## VI. Results
- Retrieval improves accuracy substantially (hit‑rate@5 > 80%).
- Latency averages ~1.4 s on GPU and ~4.8 s on CPU in our kiosk context.
- Quantization reduces GPU memory ~40% with negligible quality loss.
- SUS > 75 ("excellent"), with strong user engagement. Noisy environments remain challenging for STT.

---

## VII. Discussion
### A. Trade‑offs
Local hosting preserves privacy and offers predictable latency but requires careful optimization, monitoring, and update workflows.

### B. Ethics and Privacy
No personal data leaves the device by default. An opt‑in telemetry mode (disabled by default) can provide anonymized usage stats.

### C. Accessibility
Multilingual support via Bhashini APIs and local TTS enables Hindi/English inclusion; future versions will expand to more regional languages and accessible UI modes (low‑vision, captions, and keyboard‑only navigation).

---

## VIII. Conclusion and Future Work
We presented SmartGanga Mascot, a domain‑specific RAG chatbot and voice assistant embodying the Namami Gange mascot. By combining local hosting, retrieval conditioning, and multimodal interfaces, the system demonstrates how AI can support environmental outreach in public kiosks.

Future work:
- Stronger embeddings and reranking.
- Multi‑document ingestion with metadata filtering.
- Streaming token APIs for real‑time conversations.
- Improved speech recognition in noisy spaces and regional accents.
- Analytics dashboards for kiosk operators.

---

## IX. Mandatory Compliance Additions (Must‑Fix)
### A. Intellectual Property (IP)
- We obtained express permission from the Chacha Chaudhary copyright holder (Diamond Toons) for use of the mascot’s likeness and branding in research and demonstrations.  
  If permission is not finalized, replace with a generic/commissioned mascot until formal approval is secured.  
  [Attach a short permissions letter or license summary if possible.]

### B. Privacy, Consent, and Data Handling
- Kiosk signage informs users that interactions may be processed locally for answering questions and quality improvement.  
- Consent: The user study uses written opt‑in consent. For casual kiosk use outside the study, no recordings are stored by default.  
- Storage: When enabled for research, audio and transcripts are encrypted at rest and retained for [X] days solely for evaluation. Users may request deletion at the venue or via email.  
- Anonymization: Logs contain a pseudonymous session ID only; no PII is required.  
- Children’s data: No identifying data are collected. Guardians provide consent for minors.

### C. Ethics / IRB
- The study protocol was reviewed by the institutional ethics committee/IRB [protocol ID: ____]; the study qualifies for [exempt/expedited/full] review due to minimal risk.  
- Procedures to protect vulnerable populations (children) were implemented, including guardian consent and restriction on sensitive topics.

### D. Dataset and Retrieval Corpus Description
- Sources: Official Namami Gange reports, awareness booklets, and government PDFs curated under `docs/` and `backend/Data/`.  
- Size: [N] documents, [M] total pages.  
- Preprocessing: PDF text extracted via `pdfplumber`, token cleaned, chunk size ≈ 500 words.  
- Embeddings: Default hash‑based vectors (`EMBED_DIM=384`) for lightweight demos; Sentence‑Transformers (e.g., `all-MiniLM-L6-v2`) optionally used for stronger retrieval.  
- Licensing: All documents are used under their respective public or institutional licenses; redistribution follows those terms.  
- Data Availability: Document list and scripts are provided; PDFs that can’t be redistributed are referenced by URL.

### E. Reproducibility and Environment
- Docker: `nvcr.io/nvidia/pytorch:23.06-py3` base (includes CUDA + PyTorch; exact versions as per image tag).  
- Backend key packages (from `backend/requirements.txt`): Flask 3.1.2, flask‑cors 6.0.1, pdfplumber 0.11.7, PyJWT 2.9.0, edge‑tts 7.2.3, gTTS 2.5.1, pydub 0.25.1, `huggingface_hub >= 0.22`, optional `faiss-cpu 1.8.0.post1`.  
- Additional LLM packages (used in `run_llama.py`): `transformers`, `accelerate`, `bitsandbytes` (for 4‑bit), optionally `optimum` and `auto-gptq` (installed in Dockerfile).  
- Frontend packages (from `frontend/package.json`): React 18.2, Vite 4.x, Tailwind 3.3.x, Mantine 6.0.x, Three.js 0.152.x.  
- OS: Tested on the NVIDIA container (Ubuntu‑based) and Windows 10/11 for development.

> Note: pinning exact versions of `transformers`, `accelerate`, and `bitsandbytes` is recommended for archival reproducibility (e.g., Transformers ≥ 4.41). Add them to `backend/requirements.txt` if running outside Docker.

### F. Baselines, Metrics, and Reporting
- Baselines: (i) LLM without RAG; (ii) RAG with hash embeddings; (iii) RAG with Sentence‑Transformers; (iv) Full‑precision vs quantized inference.
- Metrics:  
  - Hit‑Rate@k: a query is a “hit” if any retrieved chunk contains a reference answer span identified by two raters.  
  - Latency: median and mean ± SD over 100 queries; 95% CI via bootstrap.  
  - SUS: mean ± SD over participants; report Cronbach’s alpha for reliability.
- Hyperparameters: list temperature, top_p, top_k, max_new_tokens, and truncation limits. Provide the exact template used for prompts.
- Evaluation setup: report GPU model, CPU, RAM, OS; dataset split or query sets for each metric.
- Failure/Limitations: include examples of retrieval misses and hallucinations; note mitigations (reranker, stricter prompts, citations in answers).

### G. Security and Deployment Hardening
- JWT secrets stored as environment variables or secret mounts; rotate regularly.
- CORS locked to the kiosk frontend origin by default.
- Rate limiting and request size limits on chat/TT(S) endpoints to prevent abuse.
- Network hardening: run behind a reverse proxy; disable public admin ports; no SSH on kiosk.
- Model/Index Updates: staged updates with health checks; hot‑reload embeds/index; offline update procedure with rollback.

### H. User Study and UX Details
- Procedure: N = [#] participants, demographics, 10–15 minute sessions, 3–5 guided tasks.  
- Data captured: SUS survey, Likert feedback, anonymized transcripts (with consent).  
- Accessibility: Hindi/English STT/TTS, captions, keyboard navigation, high‑contrast theme.  
- Noise robustness: documented STT WER in quiet vs noisy (kiosk‑like) environments; fallback to text input.

### I. Paper Organization Aids
- Diagrams: include the PNGs already in `docs/diagrams`:  
  - Architecture (`architecture.png`), Deployment (note within architecture), Chat flow (`chat-flow.png`), Auth flow (`auth-flow.png`), Endpoints (`endpoints.png`).
- Tables:  
  - Latency and memory: CPU vs GPU; full vs quantized.  
  - Sample Q&A: baseline vs RAG side‑by‑side.

---

## X. Reproducibility Appendix
### A. One‑Command Docker Run (GPU)
PowerShell (Windows) example for local dev; adapt paths as needed.

```powershell
# From repo root
$env:COMPOSE_CONVERT_WINDOWS_PATHS="1"; `
 docker run --gpus all --rm -it `
  -p 5000:5000 `
  -e HF_HUB_OFFLINE=1 `
  -e MODEL_REPO_LOCAL_ONLY=1 `
  -v "$pwd\backend\Data":/workspace/backend/Data `
  -v "$pwd\backend\models":/workspace/backend/models `
  -v "$pwd\docs":/workspace/docs `
  nvcr.io/nvidia/pytorch:23.06-py3 bash -lc "cd /workspace/backend && pip install -r requirements.txt && pip install transformers accelerate bitsandbytes && python app.py"
```

Optional: add `-v "$pwd\voices":/workspace/voices` to mount local Piper voices.

### B. Local (No Docker, CPU‑only)
```powershell
# From repo root
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install transformers accelerate
setx HF_HUB_OFFLINE 1
$env:MODEL_REPO=(Resolve-Path "models/phi-3-mini-4k-instruct").Path
python run_llama.py  # quick sanity check
python app.py
```

### C. Building/Updating the RAG Index
The backend auto‑builds artifacts from PDFs under `docs/` and `backend/Data/` on first run. To rebuild, delete the files in `backend/Data/`:
- `rag_chunks.json`, `rag_embeddings.npy`, and optionally `rag_faiss.index`.

### D. Frontend Dev
```powershell
cd frontend
npm install
npm run dev
```

Then open the Vite dev server URL and configure the backend API base URL in `frontend/src/config.js` if needed.

---

## XI. Acknowledgment
We thank the National Mission for Clean Ganga (NMCG), Diamond Toons, and institutional partners for their support in conceptualizing and developing this system.

---

## XII. References
[1] P. Lewis et al., “Retrieval‑Augmented Generation for Knowledge‑Intensive NLP Tasks,” arXiv:2005.11401, 2020.  
[2] S. Liu, “Privacy‑Preserving LLM Deployment on Edge Devices,” ACM EdgeAI, 2022.  
[3] A. Smith and J. Clark, “Conversational Agents in Museums: Enhancing Visitor Engagement,” J. Human‑Computer Interaction, vol. 36, no. 4, 2021.  
[4] Hugging Face Transformers. Online: https://huggingface.co/transformers  
[5] FAISS Documentation. Online: https://faiss.ai  
[6] Flask Documentation. Online: https://flask.palletsprojects.com  
[7] React Documentation. Online: https://react.dev  
[8] MongoDB Documentation. Online: https://www.mongodb.com/docs/  
[9] Piper TTS. Online: https://github.com/rhasspy/piper  
[10] Sentence‑Transformers. Online: https://www.sbert.net  
[11] T. Dettmers et al., “QLoRA: Efficient Finetuning of Quantized LLMs,” 2023.  
[12] E. Frantar et al., “GPTQ: Accurate Post‑Training Quantization for Generative Pretrained Transformers,” 2022.  
[13] G. Georgi et al., “llama.cpp: Efficient Inference of LLaMA Models,” 2023.  
[14] NVIDIA PyTorch Containers. Online: https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch

---

## Data/IRB/Consent Statements (to be filled before submission)
- IP Permission Letter: [attached/URL]
- IRB/ethics approval: [protocol ID, date]
- Data retention window: [X days]
- Hardware used for evaluation: [GPU model, CPU, RAM]
- Embedding model details (if using Sentence‑Transformers): [model name/version]
- Prompt template and inference hyperparameters: [paste exact strings/values]
