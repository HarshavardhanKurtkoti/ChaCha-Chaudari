"""
Simple helper to download a local copy of Phi-3-mini instruct.

For more options (destination, revision), use tools/download_local_llm.py instead.
"""
from __future__ import annotations
import os
from pathlib import Path
from huggingface_hub import snapshot_download

DEFAULT_REPO = "microsoft/Phi-3-mini-4k-instruct"
DST = Path(os.getcwd()).joinpath("models", "phi-3-mini-4k-instruct")
DST.mkdir(parents=True, exist_ok=True)

print(f"Downloading {DEFAULT_REPO} to {DST} ...")
local_path = snapshot_download(repo_id=DEFAULT_REPO, local_dir=str(DST), local_dir_use_symlinks=False)
print("Done.")
print("Local model path:", local_path)
