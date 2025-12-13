import asyncio
import websockets
import json

async def test_client(symbol="AAPL"):
    uri = "ws://localhost:3009"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            # Send subscription request

            request = json.dumps({"symbol": symbol})
            print(f"Sending request: {request}")
            await websocket.send(request)

            print(f"Listening for {symbol} ticks... (Press Ctrl+C to stop)")
            while True:
                message = await websocket.recv()
                try:
                    data = json.loads(message)
                    print(f"Received: {data['symbol']} | Price: {data['price']} | Time: {data['utc_timestamp']}")
                except json.JSONDecodeError:
                    print(f"Received raw: {message}")
                    
    except ConnectionRefusedError:
        print("Connection failed. Is the server running?")
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed by server")

if __name__ == "__main__":
    try:
        asyncio.run(test_client("NVDA"))
    except KeyboardInterrupt:
        print("\nTest client stopped")
