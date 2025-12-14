# VecDB Dockerfile
# Lightweight image that installs chromadb and runs the simple HTTP server

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by some Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       git \
       gcc \
       libsqlite3-dev \
       libssl-dev \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser \
    && mkdir -p /home/appuser \
    && mkdir -p /home/appuser/.cache \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app

ENV HOME=/home/appuser
ENV XDG_CACHE_HOME=/home/appuser/.cache

USER appuser

# Expose port from GLOVAR (3004)
EXPOSE 3004

# Default command
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3004"]
