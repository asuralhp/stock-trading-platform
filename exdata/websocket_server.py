import asyncio
import json
import os
import uuid

import websockets
from aiokafka import AIOKafkaConsumer

import GLOVAR


async def handler(websocket):
    consumer = None
    try:
        # Wait for the client to send the symbol
        # Expected format: {"symbol": "AAPL"}
        message = await websocket.recv()
        try:
            data = json.loads(message)
            symbol = data.get("symbol")
        except json.JSONDecodeError:
            await websocket.send(json.dumps({"error": "Invalid JSON"}))
            return

        if not symbol:
            await websocket.send(json.dumps({"error": "No symbol provided"}))
            return

        topic = f"tick-{symbol}"
        print(f"Client connected. Subscribing to: {topic}")

        # Unique group_id to ensure every client gets all messages (broadcast)
        group_id = f"ws-group-{uuid.uuid4()}"

        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
            group_id=group_id,
            # start from earliest to deliver any queued ticks to new clients; switch to 'latest' if you only want live data
            auto_offset_reset=os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest"),
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        
        await consumer.start()
        
        try:
            async for msg in consumer:
                tick = msg.value
                await websocket.send(json.dumps(tick))
        except Exception as e:
            print(f"Error sending message: {e}")
            
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if consumer:
            await consumer.stop()
        print("Connection handler finished")

async def main():
    host = os.getenv("WS_HOST", "0.0.0.0")
    port = int(os.getenv("PORT_SERVER", GLOVAR.PORT_SERVER))
    print(f"Starting WebSocket Server on ws://{host}:{port}")
    async with websockets.serve(handler, host, port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nWebSocket Server stopped")
