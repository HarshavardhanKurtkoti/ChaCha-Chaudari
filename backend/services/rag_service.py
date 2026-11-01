"""
RAG Service for ChaCha-Chaudari.
Provides document chunking, embedding generation (SentenceTransformer / hash fallback),
vector search (FAISS / numpy cosine similarity), and grounded context assembly.
Lazy and safe: does NOT block on module import.
"""
from __future__ import annotations

import os
import json
import logging
import hashlib
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

log = logging.getLogger(__name__)

try:
    import faiss  # type: ignore
    _FAISS_AVAILABLE = True
except Exception:
    faiss = None  # type: ignore
    _FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    _ST_AVAILABLE = True
except Exception:
    SentenceTransformer = None  # type: ignore
    _ST_AVAILABLE = False

try:
    import pdfplumber  # type: ignore
    _PDFPLUMBER_AVAILABLE = True
except Exception:
    pdfplumber = None  # type: ignore
    _PDFPLUMBER_AVAILABLE = False


class RAGService:
    def __init__(
        self,
        data_dir: Optional[str] = None,
        embed_dim: int = 384,
        top_k: int = 3,
    ):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        self.data_dir = data_dir or os.path.join(base_dir, "Data")
        os.makedirs(self.data_dir, exist_ok=True)

        self.embed_dim = embed_dim
        self.top_k = top_k

        self.chunks_path = os.path.join(self.data_dir, "rag_chunks.json")
        self.emb_path = os.path.join(self.data_dir, "rag_embeddings.npy")
        self.faiss_path = os.path.join(self.data_dir, "rag_faiss.index")

        self.chunks: List[str] = []
        self.embeddings: Optional[np.ndarray] = None
        self.faiss_index: Optional[Any] = None
        self.embedder_model: Optional[Any] = None

        self._initialized = False

    def _get_embedder(self):
        if self.embedder_model is None and _ST_AVAILABLE and SentenceTransformer is not None:
            try:
                self.embedder_model = SentenceTransformer("all-MiniLM-L6-v2")
                get_dim = getattr(self.embedder_model, "get_embedding_dimension", None) or getattr(self.embedder_model, "get_sentence_embedding_dimension", None)
                self.embed_dim = get_dim() if callable(get_dim) else 384
                log.info("Initialized SentenceTransformer('all-MiniLM-L6-v2') with dim %d", self.embed_dim)
            except Exception as e:
                log.warning("Could not load SentenceTransformer; using hash embedder fallback: %s", e)
                self.embedder_model = None
        return self.embedder_model

    def hash_embed(self, text: str, dim: Optional[int] = None) -> np.ndarray:
        """Deterministic pseudo-embedding for lightweight/offline environments."""
        d = dim or self.embed_dim
        vec = np.zeros(d, dtype=np.float32)
        for token in text.split():
            h = int(hashlib.sha1(token.encode("utf-8")).hexdigest(), 16)
            vec[h % d] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Embed a list of text snippets into an (N, D) float32 matrix."""
        if not texts:
            return np.zeros((0, self.embed_dim), dtype=np.float32)

        model = self._get_embedder()
        if model is not None:
            try:
                emb = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
                return emb.astype(np.float32)
            except Exception as e:
                log.warning("SentenceTransformer encode failed; falling back to hash: %s", e)

        vecs = [self.hash_embed(t, self.embed_dim) for t in texts]
        return np.vstack(vecs)

    def ensure_initialized(self) -> None:
        """Load persisted index or initialize from seed data without blocking."""
        if self._initialized:
            return

        if os.path.exists(self.chunks_path) and os.path.exists(self.emb_path):
            try:
                with open(self.chunks_path, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
                self.embeddings = np.load(self.emb_path)

                if _FAISS_AVAILABLE and faiss is not None and os.path.exists(self.faiss_path):
                    try:
                        self.faiss_index = faiss.read_index(self.faiss_path)
                    except Exception:
                        self.faiss_index = None

                self._initialized = True
                log.info("RAG Service loaded %d chunks from persisted artifacts.", len(self.chunks))
                return
            except Exception as e:
                log.warning("Failed to load RAG artifacts: %s", e)

        # If artifacts do not exist, provide default knowledge base chunks
        self.chunks = [
            "The Namami Gange Programme is an Integrated Conservation Mission approved as a 'Flagship Programme' "
            "by the Union Government in June 2014 with a budget outlay of Rs.20,000 Crore to accomplish the twin objectives "
            "of effective abatement of pollution, conservation and rejuvenation of National River Ganga.",

            "Ganges River Dolphin (Platanista gangetica) is the National Aquatic Animal of India. "
            "It is recognized as a vital bio-indicator of the health of the river ecosystem and is listed as Endangered "
            "in the IUCN Red List. Protection measures include community guards (Ganga Praharis) and protected stretches.",

            "Key pillars of Namami Gange include: Sewage Treatment Infrastructure, River-Front Development, "
            "River-Surface Cleaning, Bio-Diversity conservation, Afforestation along banks, Public Awareness, "
            "Industrial Effluent Monitoring, and Ganga Gram (model village sanitation).",

            "Sewage Treatment Plants (STPs) have been constructed across Uttarakhand, Uttar Pradesh, Bihar, "
            "Jharkhand, and West Bengal to prevent untreated municipal sewage from entering the holy river.",

            "Gharials and Indian softshell turtles are regularly reared and released in protected tributaries like Chambal "
            "and stretches near Varanasi and Haridwar to balance the aquatic food chain and clean biological waste.",
        ]
        self.embeddings = self.embed_texts(self.chunks)

        if _FAISS_AVAILABLE and faiss is not None and self.embeddings is not None and self.embeddings.shape[0] > 0:
            try:
                idx = faiss.IndexFlatL2(self.embeddings.shape[1])
                idx.add(self.embeddings)
                self.faiss_index = idx
            except Exception:
                self.faiss_index = None

        self._save_artifacts()
        self._initialized = True
        log.info("RAG Service initialized with %d default knowledge chunks.", len(self.chunks))

    def _save_artifacts(self) -> None:
        try:
            with open(self.chunks_path, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, ensure_ascii=False, indent=2)
            if self.embeddings is not None:
                np.save(self.emb_path, self.embeddings)
            if _FAISS_AVAILABLE and faiss is not None and self.faiss_index is not None:
                faiss.write_index(self.faiss_index, self.faiss_path)
        except Exception as e:
            log.warning("Could not persist RAG artifacts: %s", e)

    def retrieve(self, query_text: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for a given query."""
        self.ensure_initialized()
        if not self.chunks or self.embeddings is None or len(self.chunks) == 0:
            return []

        k = top_k or self.top_k
        k = min(k, len(self.chunks))

        q_vec = self.embed_texts([query_text])[0]

        # Use FAISS if ready
        if _FAISS_AVAILABLE and self.faiss_index is not None:
            try:
                dists, idxs = self.faiss_index.search(np.expand_dims(q_vec, 0), k)
                results = []
                for dist, idx in zip(dists[0], idxs[0]):
                    if 0 <= idx < len(self.chunks):
                        results.append({"chunk": self.chunks[idx], "distance": float(dist)})
                return results
            except Exception as e:
                log.warning("FAISS search error; falling back to cosine: %s", e)

        # Fallback: Cosine similarity via matrix multiplication
        sims = self.embeddings @ q_vec
        best_indices = np.argsort(-sims)[:k]
        return [{"chunk": self.chunks[int(i)], "distance": float(1.0 - sims[int(i)])} for i in best_indices]
