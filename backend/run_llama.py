"""
Quick local generation test for the currently configured local model.

Reads MODEL_REPO from the environment (or defaults to backend/models/phi-3-mini-4k-instruct)
and runs a single short generation to verify the model loads offline.

Usage (PowerShell from backend/):
  $env:MODEL_REPO=(Resolve-Path "models/phi-3-mini-4k-instruct").Path
  python run_llama.py
"""
import os
import sys
import traceback

os.environ.setdefault('HF_HUB_OFFLINE', '1')

try:
  import torch
  from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
except Exception as e:
  print("Required packages missing. Install with: pip install transformers accelerate bitsandbytes", file=sys.stderr)
  raise

MODEL_REPO = os.environ.get('MODEL_REPO') or os.path.join(os.getcwd(), 'models', 'phi-3-mini-4k-instruct')
is_local_path = os.path.isdir(MODEL_REPO)

print(f"Loading model from {'local path' if is_local_path else 'repo id'}: {MODEL_REPO}")

# Try a 4-bit bitsandbytes load first (if available), otherwise fall back to fp16/auto device map
tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, use_fast=True, local_files_only=is_local_path)
model = None
try:
  # Configure a conservative 4-bit quantization suited for inference
  bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
  )
  print('Attempting 4-bit quantized load with bitsandbytes...')
  model = AutoModelForCausalLM.from_pretrained(
    MODEL_REPO,
    quantization_config=bnb_config,
    device_map='auto',
    trust_remote_code=True,
    local_files_only=is_local_path,
    attn_implementation='eager',
  )
except Exception:
  print('4-bit load failed or bitsandbytes not available; falling back to standard load')
  traceback.print_exc()
  try:
    model = AutoModelForCausalLM.from_pretrained(
      MODEL_REPO,
      device_map='auto',
      trust_remote_code=True,
      local_files_only=is_local_path,
      attn_implementation='eager',
    )
  except Exception:
    print('Standard load also failed; retrying without attn override...')
    traceback.print_exc()
    model = AutoModelForCausalLM.from_pretrained(
      MODEL_REPO,
      device_map='auto',
      trust_remote_code=True,
      local_files_only=is_local_path,
    )

print('Model loaded. Device:', next(model.parameters()).device)

# Short, story-focused prompt to test both speed and 'storification'
prompt = (
  "Tell a short 3-sentence story for kids about keeping the Ganga clean. "
  "Make it warm, simple, and include one concrete action kids can do today."
)
inputs = tokenizer(prompt, return_tensors='pt')
try:
  inputs = inputs.to(next(model.parameters()).device)
except Exception:
  # If device move fails, leave tensors on CPU and let generate handle device placement
  pass

# Faster generation defaults for interactive use
gen_kwargs = dict(max_new_tokens=120, do_sample=True, temperature=0.7, top_p=0.95)
out = model.generate(**inputs, **gen_kwargs)
print(tokenizer.decode(out[0], skip_special_tokens=True))
