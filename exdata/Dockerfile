# Base image for the exdata services (producer + websocket server)
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install Python deps
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Defaults for container networking
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
    PORT_SERVER=3009 \
    WS_HOST=0.0.0.0

EXPOSE 3009

# Default entrypoint runs the websocket server; override in compose for producer
CMD ["python", "-m", "websocket_server"]
