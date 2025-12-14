# Market Data Kafka 

- start docker/k8s
- docker-compose up -d
- wait til Running
- python -m producer
- python -m websocket_server




## Docker


Added 3 todos

One-line plan: I'll give a simple, copy-paste run sequence for PowerShell and what to check next.

Run these from the exdata folder.

1) Build images
```powershell
docker compose build
```

2) Start infra (ZooKeeper + Kafka)
```powershell
docker compose up -d zookeeper kafka
```
- Wait a few seconds and check Kafka logs:
```powershell
docker compose logs -f kafka
```
Look for broker started / ready messages.

3) Start the producer (publishes ticks to Kafka)
- Run detached (keeps producing until it finishes):
```powershell
docker compose up -d exdata-producer
```
- Or run once interactively (runs producer and exits):
```powershell
docker compose run --rm exdata-producer
```

4) Start websocket server (consumes ticks and serves WS)
```powershell
docker compose up -d exdata-ws
```

5) Follow logs to confirm messages flow
```powershell
docker compose logs -f exdata-producer exdata-ws kafka
```
- You should see the producer sending ticks and the websocket server subscribing/sending ticks to clients.

Notes and troubleshooting
- Dependency chain: we set compose so kafka -> zookeeper, exdata-producer -> kafka, exdata-ws -> exdata-producer. However, Docker's `depends_on` doesn't wait for service readiness; if a service fails to find Kafka ready, check `kafka` logs and restart `exdata-producer`/`exdata-ws`:
```powershell
docker compose restart exdata-producer
docker compose restart exdata-ws
```
- If the webapp still shows “No data”, confirm:
  - WS endpoint is reachable: `ws://localhost:3009` (server binds to 0.0.0.0, port 3009)
  - Producer is actually producing messages into `tick-<SYMBOL>` topics (see `exdata-producer` logs)
  - Kafka advertised listeners are correct for your environment (compose sets in-network address `kafka:9092` and host `localhost:9092`).
- To run locally without Docker (quick test), open two PowerShell windows in exdata:
  - Terminal A (producer): `python -m producer`
  - Terminal B (ws server): `python -m websocket_server`
  - This assumes a local Kafka is listening on the bootstrap address set (default `kafka:9092` in container, or change `KAFKA_BOOTSTRAP_SERVERS` env to `127.0.0.1:9092` before running).

Would you like me to:
- Run the above `docker compose` commands for you now (I can run them if you want), or
- Add healthchecks to the compose file so services wait until Kafka is healthy before starting?