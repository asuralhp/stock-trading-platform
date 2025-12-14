# Agent backend Dockerfile
# Uses Python slim image, installs dependencies and runs the server

FROM python:3.11-slim

# Environment settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-root user for running the app
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

# Install system deps needed to build some Python packages (kept minimal)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# Ensure app files are owned by non-root user
RUN chown -R appuser:appuser /app

USER appuser

# Expose the port the README indicates (3003)
EXPOSE 3003

# Start command: prefer uvicorn if available, otherwise fall back to python server.py
CMD ["sh", "-c", "(command -v uvicorn >/dev/null 2>&1 && exec uvicorn server:app --host 0.0.0.0 --port 3003) || exec python server.py"]
