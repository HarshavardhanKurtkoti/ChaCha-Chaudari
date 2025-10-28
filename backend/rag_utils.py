"""Lightweight RAG utilities with zero-heavy dependencies.

Default mode uses a simple hashing-based embedding to avoid pulling large ML stacks
that can cause env issues (torch/numba/librosa). It supports:
- Multi-PDF ingestion (from a configured folder)
- Optional FAISS acceleration if ``faiss`` is installed
- Drop-in ``index.search`` API so ``app.py`` can stay unchanged
- Persistence of chunks/embeddings (and FAISS index if available)

Trade-offs in default mode:
- Hash-based vectors are not semantic; retrieval quality is approximate/random.
- Good enough to wire chat + RAG end-to-end. For production, replace ``hash_embed``
    with a proper text embedding (e.g. SentenceTransformers) behind the same interface,
    or set an env flag and branch to a stronger embedder.
"""

import os
import json
import pdfplumber
import warnings
import sys
import hashlib
import numpy as np
try:
    import faiss  # type: ignore
    _FAISS_OK = True
except Exception:
    faiss = None  # type: ignore
    _FAISS_OK = False

###############################################################################
# Configuration
###############################################################################

# Embedding dimensionality used throughout this module (kept small/lightweight)
EMBED_DIM = int(os.environ.get("RAG_EMBED_DIM", "384"))

# Where to read/write persisted artifacts
_THIS_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(_THIS_DIR, "Data")
os.makedirs(DATA_DIR, exist_ok=True)
CHUNKS_PATH = os.path.join(DATA_DIR, "rag_chunks.json")
EMB_PATH = os.path.join(DATA_DIR, "rag_embeddings.npy")
FAISS_PATH = os.path.join(DATA_DIR, "rag_faiss.index")

# Where to look for PDFs by default (docs/ at repo root and backend/Data)
DEFAULT_PDF_DIRS = [
    os.path.abspath(os.path.join(_THIS_DIR, "..", "docs")),
    DATA_DIR,
]
ENV_PDF_DIR = os.environ.get("RAG_PDF_DIR")
if ENV_PDF_DIR:
    DEFAULT_PDF_DIRS.insert(0, os.path.abspath(ENV_PDF_DIR))


def extract_pdf_text(pdf_path: str) -> str:
    warnings.filterwarnings("ignore", message="Cannot set gray non-stroke color*")

    class PDFWarningFilter:
        def write(self, msg):
            if "Cannot set gray non-stroke color" not in msg:
                sys.__stderr__.write(msg)

        def flush(self):
            pass

    orig_stderr = sys.stderr
    sys.stderr = PDFWarningFilter()
    text = []
    try:
        if not os.path.isfile(pdf_path):
            # File missing; return empty text to keep pipeline alive
            return ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text.append(page_text)
    finally:
        sys.stderr = orig_stderr
    return "\n".join(text)


def chunk_text(text: str, chunk_size: int = 500):
    words = text.split()
    return [" ".join(words[i : i + chunk_size]) for i in range(0, len(words), chunk_size)]


def hash_embed(text: str, dim: int = EMBED_DIM) -> np.ndarray:
    """Create a deterministic pseudo-embedding via hashing tokens.

    This is NOT semantic; it's just enough to keep a FAISS demo running
    without bringing in numba/librosa heavy deps through transformers Trainer.
    """

    vec = np.zeros(dim, dtype=np.float32)
    for token in text.split():
        h = int(hashlib.sha1(token.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    # L2 normalize
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


class SimpleIndex:
    """A tiny FAISS-like shim with a ``search`` method using cosine similarity.

    Keeps ``app.py`` unchanged when FAISS isn't installed. Accepts an L2-normalized
    embeddings matrix and returns distances (1 - cosine) to mimic FAISS L2-ish order.
    """

    def __init__(self, embeddings: np.ndarray):
        self.embeddings = embeddings.astype(np.float32) if embeddings is not None else None

    def search(self, query_mat: np.ndarray, k: int = 3):
        if self.embeddings is None or self.embeddings.shape[0] == 0:
            D = np.zeros((query_mat.shape[0], 0), dtype=np.float32)
            I = -np.ones((query_mat.shape[0], 0), dtype=np.int64)
            return D, I
        # Ensure L2-normalized query rows
        Q = query_mat.astype(np.float32)
        norms = np.linalg.norm(Q, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        Q = Q / norms
        sims = Q @ self.embeddings.T  # cosine similarity
        # Convert to pseudo-distances similar to FAISS L2 ordering
        # Higher sim => lower distance
        order = np.argsort(-sims, axis=1)
        topk = order[:, :k]
        top_sim = np.take_along_axis(sims, topk, axis=1)
        D = (1.0 - top_sim).astype(np.float32)
        I = topk.astype(np.int64)
        return D, I


def build_index(chunks_list, dim: int = EMBED_DIM):
    if not chunks_list:
        if _FAISS_OK:
            index_inst = faiss.IndexFlatL2(dim)
        else:
            index_inst = SimpleIndex(np.zeros((0, dim), dtype=np.float32))
        empty_mat = np.zeros((0, dim), dtype=np.float32)
        return index_inst, empty_mat
    emb_list = [hash_embed(c, dim=dim) for c in chunks_list]
    mat = np.vstack(emb_list)
    if _FAISS_OK:
        index_inst = faiss.IndexFlatL2(mat.shape[1])
        index_inst.add(mat)
    else:
        index_inst = SimpleIndex(mat)
    return index_inst, mat


def _save_artifacts(chunks_list, embeddings_mat, faiss_index=None):
    try:
        with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
            json.dump(chunks_list, f, ensure_ascii=False)
    except Exception:
        pass
    try:
        if isinstance(embeddings_mat, np.ndarray):
            np.save(EMB_PATH, embeddings_mat)
    except Exception:
        pass
    if _FAISS_OK and faiss_index is not None:
        try:
            faiss.write_index(faiss_index, FAISS_PATH)
        except Exception:
            pass


def _load_artifacts():
    chunks_list = None
    emb = None
    faiss_idx = None
    try:
        if os.path.exists(CHUNKS_PATH):
            with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
                chunks_list = json.load(f)
    except Exception:
        chunks_list = None
    try:
        if os.path.exists(EMB_PATH):
            emb = np.load(EMB_PATH)
            # Ensure shape consistency
            if emb.ndim != 2 or emb.shape[1] != EMBED_DIM:
                emb = None
    except Exception:
        emb = None
    if _FAISS_OK:
        try:
            if os.path.exists(FAISS_PATH):
                faiss_idx = faiss.read_index(FAISS_PATH)
        except Exception:
            faiss_idx = None
    return chunks_list, emb, faiss_idx


###############################################################################
# Build or load RAG data
###############################################################################

# 1) Try to load persisted artifacts
_chunks, _emb, _faiss_idx = _load_artifacts()

if _chunks is None or _emb is None or (_FAISS_OK and _faiss_idx is None):
    # 2) Build from PDFs on disk
    texts = []
    for root in DEFAULT_PDF_DIRS:
        try:
            if not os.path.isdir(root):
                continue
            for dirpath, _, filenames in os.walk(root):
                for fn in filenames:
                    if fn.lower().endswith(".pdf"):
                        full = os.path.join(dirpath, fn)
                        txt = extract_pdf_text(full)
                        if txt.strip():
                            texts.append(txt)
        except Exception:
            continue
    all_text = "\n\n".join(texts)
    chunks = chunk_text(all_text)
    index, embeddings = build_index(chunks)
    # Persist artifacts (FAISS only if present)
    _save_artifacts(chunks, embeddings, index if _FAISS_OK else None)
else:
    # 3) Use loaded artifacts
    chunks = _chunks
    embeddings = _emb
    if _FAISS_OK and _faiss_idx is not None:
        index = _faiss_idx
    else:
        index = SimpleIndex(embeddings)

class SimpleEmbedder:
    """Minimal encoder compatible with app.py expectations.

    .encode(texts: List[str]) -> np.ndarray of shape (N, D)
    Uses the same hash-based embedding to stay dependency-light.
    """

    def __init__(self, dim: int = EMBED_DIM):
        self.dim = dim

    def encode(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        vecs = [hash_embed(t, dim=self.dim) for t in texts]
        return np.vstack(vecs)


# Expose an embedder compatible with app.py: from rag_utils import embedder, index, chunks
embedder = SimpleEmbedder()


def query(text: str, top_k: int = 3):
    q = hash_embed(text)
    results = []
    if index is not None and _FAISS_OK:
        D, I = index.search(np.expand_dims(q, 0), top_k)
        for dist, idx in zip(D[0], I[0]):
            if idx < 0 or idx >= len(chunks):
                continue
            results.append({"chunk": chunks[idx], "distance": float(dist)})
        return results
    # Fallback: simple cosine similarity over embeddings
    if embeddings is None or embeddings.shape[0] == 0:
        return []
    sims = embeddings @ q  # since vectors are L2-normalized, dot approximates cosine
    top_idx = np.argsort(-sims)[:top_k]
    for idx in top_idx:
        results.append({"chunk": chunks[int(idx)], "distance": float(1.0 - sims[int(idx)])})
    return results


def get_status() -> dict:
    """Diagnostic info for /tts-diagnostic-like endpoint if needed."""
    return {
        "chunks": len(chunks) if isinstance(chunks, list) else 0,
        "embeddings_shape": list(embeddings.shape) if isinstance(embeddings, np.ndarray) else None,
        "faiss_available": _FAISS_OK,
        "faiss_type": type(index).__name__ if index is not None else None,
        "data_dir": DATA_DIR,
        "artifacts": {
            "chunks": os.path.exists(CHUNKS_PATH),
            "embeddings": os.path.exists(EMB_PATH),
            "faiss_index": os.path.exists(FAISS_PATH),
        },
    }
