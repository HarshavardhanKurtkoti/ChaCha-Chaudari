# Use NVIDIA PyTorch pre-built image (includes CUDA, torch, torchvision, torchaudio)
FROM nvcr.io/nvidia/pytorch:23.06-py3

# Set up Python and system dependencies


ENV DEBIAN_FRONTEND=noninteractive \
	TRANSFORMERS_NO_AUDIO=1 \
	TRANSFORMERS_NO_TORCHVISION=1 \
	PYTHONUNBUFFERED=1 \
	NUMBA_DISABLE_JIT=1
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN python3 -m pip install --upgrade pip


# Set workdir
WORKDIR /workspace/backend


# Copy requirements and source code
COPY backend/requirements.txt /workspace/backend/requirements.txt
COPY backend/ /workspace/backend/


# Install Python dependencies (torch, torchvision, torchaudio already included)
RUN pip install -r /workspace/backend/requirements.txt \
 && pip install auto-gptq optimum


# Expose Flask port
EXPOSE 5000

# Default command
CMD ["python3", "/workspace/backend/app.py"]
