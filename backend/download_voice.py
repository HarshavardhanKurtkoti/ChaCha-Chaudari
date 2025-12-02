import os
import requests

def download_file(url, dest):
    print(f"Downloading {url} to {dest}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(dest, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Download complete.")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

base_url = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_IN/kieran/medium/"
files = ["en_IN-kieran-medium.onnx", "en_IN-kieran-medium.onnx.json"]
dest_dir = r"c:\Local-Disk D\Projects\capstone\backend\voices\piper"

os.makedirs(dest_dir, exist_ok=True)

for f in files:
    download_file(base_url + f, os.path.join(dest_dir, f))
