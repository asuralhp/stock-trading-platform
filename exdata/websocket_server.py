import asyncio
import json
import websockets
from aiokafka import AIOKafkaConsumer
import uuid
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
            bootstrap_servers='localhost:9092',
            group_id=group_id,
            # start from earliest to deliver any queued ticks to new clients
            # auto_offset_reset='earliest',
            auto_offset_reset='latest',
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
    print(f"Starting WebSocket Server on ws://localhost:{GLOVAR.PORT_SERVER}")
    async with websockets.serve(handler, "localhost", GLOVAR.PORT_SERVER):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nWebSocket Server stopped")
