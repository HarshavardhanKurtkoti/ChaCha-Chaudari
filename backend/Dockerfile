# Ultra-lightweight Cloud Dockerfile (Backend Context)
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

# Copy requirements and install without pip upgrade to avoid PyPI DNS/network issues
COPY requirements.cloud.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source code and pre-embedded RAG data
COPY . /app/

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Production Gunicorn server bound to dynamic Render port
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 4 --timeout 120 app:app"]
