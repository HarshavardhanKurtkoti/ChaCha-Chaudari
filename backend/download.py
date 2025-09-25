from huggingface_hub import hf_hub_download

# Quantized GGUF file name inside the repo
filename = "llama-2-7b-chat.Q4_K_M.gguf"

# Repo and local path
repo_id = "TheBloke/Llama-2-7B-Chat-GGUF"
local_path = hf_hub_download(repo_id=repo_id, filename=filename)

print("Downloaded quantized model to:", local_path)
