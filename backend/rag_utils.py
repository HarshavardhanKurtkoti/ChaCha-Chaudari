"""Lightweight RAG utilities without heavy sentence_transformers dependency.

We replace the SentenceTransformer embedding with a simple hashing based embedding.
This avoids importing transformers' Trainer stack (and thus librosa/numba) which was
crashing inside the container. For production quality semantic search you should
re-introduce a proper embedding model once the environment issues are resolved.

Limitations:
- Hash-based vectors are not semantic; retrieval quality is approximate/random.
- Adequate only to keep the rest of the pipeline functional for now.
"""

import os
import pdfplumber
import warnings
import sys
import hashlib
import numpy as np
import faiss

# Embedding dimensionality used throughout this module
EMBED_DIM = 384


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


def build_index(chunks_list, dim: int = EMBED_DIM):
    if not chunks_list:
        # Create an empty index with correct dimensionality
        index_inst = faiss.IndexFlatL2(dim)
        empty_mat = np.zeros((0, dim), dtype=np.float32)
        return index_inst, empty_mat
    emb_list = [hash_embed(c, dim=dim) for c in chunks_list]
    mat = np.vstack(emb_list)
    index_inst = faiss.IndexFlatL2(mat.shape[1])
    index_inst.add(mat)
    return index_inst, mat


# Resolve PDF path relative to this file to avoid CWD issues
_this_dir = os.path.dirname(__file__)
_pdf_path = os.path.join(_this_dir, "Data", "AnnualReport2023.pdf")
pdf_text = extract_pdf_text(_pdf_path)
chunks = chunk_text(pdf_text)
index, embeddings = build_index(chunks)

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
    D, I = index.search(np.expand_dims(q, 0), top_k)
    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(chunks):
            continue
        results.append({"chunk": chunks[idx], "distance": float(dist)})
    return results
