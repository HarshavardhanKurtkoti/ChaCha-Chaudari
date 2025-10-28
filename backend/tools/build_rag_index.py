"""Builds a lightweight RAG index from PDFs without heavy dependencies.

- Scans one or more folders for .pdf files (default: repo docs/ and backend/Data)
- Extracts text via pdfplumber, chunks by words, embeds via hash_embed
- Saves artifacts into backend/Data:
    - rag_chunks.json          (list[str])
    - rag_embeddings.npy       (np.ndarray, shape [N, D])
    - rag_faiss.index          (optional if faiss installed)

Usage (PowerShell):
  # From repo root
  python .\backend\tools\build_rag_index.py -p .\docs,.\backend\Data -c 400

You can set env RAG_EMBED_DIM to change embedding dim (default 384).
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from typing import List

import numpy as np

# Reuse the utility functions and config from rag_utils
# Ensure this script can import its sibling module when run from repo root
_SCRIPT_DIR = os.path.dirname(__file__)
_BACKEND_DIR = os.path.abspath(os.path.join(_SCRIPT_DIR, ".."))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import rag_utils  # type: ignore

try:
    import faiss  # type: ignore
    _FAISS_OK = True
except Exception:
    faiss = None  # type: ignore
    _FAISS_OK = False


def find_pdfs(paths: List[str]) -> List[str]:
    pdfs: List[str] = []
    for base in paths:
        base = os.path.abspath(base)
        if not os.path.isdir(base):
            continue
        for dirpath, _, filenames in os.walk(base):
            for fn in filenames:
                if fn.lower().endswith(".pdf"):
                    pdfs.append(os.path.join(dirpath, fn))
    return sorted(pdfs)


def main():
    ap = argparse.ArgumentParser(description="Build lightweight RAG artifacts from PDFs")
    ap.add_argument(
        "-p",
        "--pdf-dirs",
        default=",".join(rag_utils.DEFAULT_PDF_DIRS),
        help="Comma-separated list of folders to scan for PDFs",
    )
    ap.add_argument(
        "-c",
        "--chunk-size",
        default="500",
        help="Chunk size in words (default 500)",
    )
    args = ap.parse_args()

    chunk_size = int(args.chunk_size)
    pdf_dirs = [p.strip() for p in args.pdf_dirs.split(",") if p.strip()]

    pdfs = find_pdfs(pdf_dirs)
    if not pdfs:
        print("No PDFs found in:", pdf_dirs)
        return 1

    texts: List[str] = []
    for path in pdfs:
        try:
            txt = rag_utils.extract_pdf_text(path)
            if txt.strip():
                texts.append(txt)
                print(f"Extracted: {path}")
            else:
                print(f"[warn] Empty text: {path}")
        except Exception as e:
            print(f"[error] Failed to extract {path}: {e}")

    all_text = "\n\n".join(texts)
    chunks = rag_utils.chunk_text(all_text, chunk_size=chunk_size)
    if not chunks:
        print("No chunks produced; aborting")
        return 1

    # Build embeddings
    emb_list = [rag_utils.hash_embed(c, dim=rag_utils.EMBED_DIM) for c in chunks]
    embeddings = np.vstack(emb_list)

    # Try FAISS if present
    faiss_index = None
    if _FAISS_OK:
        try:
            faiss_index = faiss.IndexFlatL2(embeddings.shape[1])
            faiss_index.add(embeddings)
        except Exception as e:
            print(f"[warn] Failed to build FAISS index: {e}")
            faiss_index = None

    # Persist artifacts
    rag_utils._save_artifacts(chunks, embeddings, faiss_index)

    print("Saved artifacts to:")
    print("  ", rag_utils.CHUNKS_PATH)
    print("  ", rag_utils.EMB_PATH)
    if _FAISS_OK and faiss_index is not None:
        print("  ", rag_utils.FAISS_PATH)
    else:
        print("  (FAISS not available; using SimpleIndex shim at runtime)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
