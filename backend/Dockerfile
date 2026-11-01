# Lightweight Cloud Dockerfile for ChaCha-Chaudari API
# Optimized for Render / Railway / Fly.io / Docker
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    LLM_PROVIDER=openrouter \
    ENABLE_LOCAL_LLM=false \
    HOST=0.0.0.0 \
    PORT=5000

WORKDIR /app

# Install minimal curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install lightweight cloud requirements
COPY requirements.cloud.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy application source and RAG data
COPY . /app/

# Expose port (Render sets $PORT dynamically)
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Production WSGI server (Gunicorn) with threaded concurrency
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 120 app:app"]

