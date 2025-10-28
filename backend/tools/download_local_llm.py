"""
Download a local copy of an HF model repo (default: Phi-3-mini 4k Instruct) into backend/models/.
This lets the backend run fully offline (local_files_only) and avoid any network calls at runtime.

Usage (PowerShell from the repo root or backend/):

  # From backend/ directory
  python tools/download_local_llm.py \
    --repo microsoft/Phi-3-mini-4k-instruct \
    --dst models/phi-3-mini-4k-instruct

  # Or from repo root
  python backend/tools/download_local_llm.py \
    --repo microsoft/Phi-3-mini-4k-instruct \
    --dst backend/models/phi-3-mini-4k-instruct

After download, you can set environment variables before running the app:

  $env:MODEL_REPO = (Resolve-Path "models/phi-3-mini-4k-instruct").Path
  $env:MODEL_REPO_LOCAL_ONLY = "1"   # strictly local
  $env:HF_HUB_OFFLINE = "1"          # offline mode

If you want to change the default model, pass --repo to a different HF repo id.
"""
from __future__ import annotations
import argparse
import os
import sys
from pathlib import Path

try:
    from huggingface_hub import snapshot_download
except Exception as e:
    print("Error: huggingface_hub is required. Install with: pip install huggingface_hub", file=sys.stderr)
    raise


def main():
    parser = argparse.ArgumentParser(description="Download an HF model repo to a local folder for offline use.")
    parser.add_argument("--repo", default="microsoft/Phi-3-mini-4k-instruct", help="Hugging Face repo id, e.g., microsoft/Phi-3-mini-4k-instruct")
    parser.add_argument("--dst", default=os.path.join("models", "phi-3-mini-4k-instruct"), help="Destination directory to store model files")
    parser.add_argument("--revision", default=None, help="Optional revision (branch/tag/commit) to pin")
    parser.add_argument("--quiet", action="store_true", help="Reduce logging noise")
    args = parser.parse_args()

    repo_id = args.repo.strip()
    dst = Path(args.dst).resolve()
    dst.mkdir(parents=True, exist_ok=True)

    # Prefer actual files instead of symlinks on Windows
    local_dir_use_symlinks = False

    print(f"Downloading repo='{repo_id}' to '{dst}' ...")
    try:
        cached_path = snapshot_download(
            repo_id=repo_id,
            local_dir=str(dst),
            local_dir_use_symlinks=local_dir_use_symlinks,
            revision=args.revision,
            # Enable fast transfer if available; safe to omit
            # allow_patterns=None,
            # ignore_patterns=None,
        )
        print("Download complete.")
        print(f"Local model path: {cached_path}")
        print("\nNext steps:")
        print(f"  - Set MODEL_REPO to: {cached_path}")
        print("  - Ensure MODEL_REPO_LOCAL_ONLY=1 and HF_HUB_OFFLINE=1 for offline runtime.")
        print("  - Start your backend. app.py will prefer local_files_only when given a folder path.")
    except Exception as e:
        print(f"Failed to download model: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
