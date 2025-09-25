"""Lightweight RAG utilities without heavy sentence_transformers dependency.

We replace the SentenceTransformer embedding with a simple hashing based embedding.
This avoids importing transformers' Trainer stack (and thus librosa/numba) which was
crashing inside the container. For production quality semantic search you should
re-introduce a proper embedding model once the environment issues are resolved.

Limitations:
- Hash-based vectors are not semantic; retrieval quality is approximate/random.
- Adequate only to keep the rest of the pipeline functional for now.
"""

import pdfplumber
import warnings
import sys
import hashlib
import numpy as np
import faiss


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


def hash_embed(text: str, dim: int = 384) -> np.ndarray:
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


def build_index(chunks_list):
    emb_list = [hash_embed(c) for c in chunks_list]
    mat = np.vstack(emb_list)
    index_inst = faiss.IndexFlatL2(mat.shape[1])
    index_inst.add(mat)
    return index_inst, mat


pdf_text = extract_pdf_text("Data/AnnualReport2023.pdf")
chunks = chunk_text(pdf_text)
index, embeddings = build_index(chunks)


def query(text: str, top_k: int = 3):
    q = hash_embed(text)
    D, I = index.search(np.expand_dims(q, 0), top_k)
    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(chunks):
            continue
        results.append({"chunk": chunks[idx], "distance": float(dist)})
    return results
