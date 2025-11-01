"""
Lightweight Piper TTS integration for local, fast offline synthesis.

Provides:
- list_piper_voices(voices_dir): scan voices directory for model/config pairs
- synthesize_with_piper(piper_path, model_path, config_path, text, out_wav):
  invoke Piper CLI and write a WAV file

Expected layout under voices_dir (default used in app.py: voices/piper/):
  voices/piper/
    hi-IN-<voice>.onnx
    hi-IN-<voice>.onnx.json
    en-IN-<voice>.onnx
    en-IN-<voice>.onnx.json

Where each .json is the Piper config that ships with the model.

On Windows, ensure piper.exe is present and its absolute path is provided in
the environment (PIPER_PATH) or .env. The backend/app.py resolves it.
"""
from __future__ import annotations

import json
import os
import subprocess
from typing import Dict, List


def _pair_models_with_configs(voices_dir: str) -> List[Dict]:
    items: List[Dict] = []
    if not os.path.isdir(voices_dir):
        return items
    for root, _dirs, files in os.walk(voices_dir):
        onnx_files = [f for f in files if f.lower().endswith('.onnx')]
        for onnx_name in onnx_files:
            base = onnx_name
            cfg_name = onnx_name + '.json'  # common convention
            # Some downloads name config without the trailing .onnx in the base
            alt_cfg_name = onnx_name.replace('.onnx', '.json')
            cfg_path = None
            if os.path.exists(os.path.join(root, cfg_name)):
                cfg_path = os.path.join(root, cfg_name)
            elif os.path.exists(os.path.join(root, alt_cfg_name)):
                cfg_path = os.path.join(root, alt_cfg_name)

            if not cfg_path:
                continue

            model_path = os.path.join(root, onnx_name)
            locale = None
            short_name = os.path.splitext(onnx_name)[0]
            try:
                with open(cfg_path, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    # Try to infer locale from config; many piper configs have a speaker or phoneme set
                    locale = cfg.get('espeak', {}).get('voice') or cfg.get('phoneme_language') or None
            except Exception:
                cfg = {}

            items.append({
                'id': short_name,
                'shortName': short_name,
                'locale': locale,
                'paths': {'model': model_path, 'config': cfg_path},
            })
    return items


def list_piper_voices(voices_dir: str) -> List[Dict]:
    """Return available Piper voices under voices_dir.

    Each item: {'id','shortName','locale','paths':{'model','config'}}
    """
    return _pair_models_with_configs(voices_dir)


def synthesize_with_piper(piper_path: str, model_path: str, config_path: str, text: str, out_wav: str) -> None:
    """Call Piper CLI to synthesize `text` into `out_wav`.

    Piper reads text from stdin; we invoke it with model/config and output path.
    Raises CalledProcessError if Piper returns non-zero.
    """
    if not text or not text.strip():
        raise ValueError('Text is empty')

    os.makedirs(os.path.dirname(out_wav) or '.', exist_ok=True)

    # Build command. Piper CLI flags (commonly):
    #   -m <model.onnx> -c <model.json> -f <out.wav>
    cmd = [
        piper_path,
        '-m', model_path,
        '-c', config_path,
        '-f', out_wav,
    ]

    # On Windows, creationflags can hide the extra console window; optional
    creationflags = 0
    if os.name == 'nt':
        creationflags = 0x08000000  # CREATE_NO_WINDOW

    proc = subprocess.run(
        cmd,
        input=text.encode('utf-8'),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=creationflags,
    )

    if proc.returncode != 0:
        raise subprocess.CalledProcessError(proc.returncode, cmd, proc.stdout, proc.stderr)
