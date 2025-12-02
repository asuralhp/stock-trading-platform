import asyncio
import websockets

async def test_chat():
    uri = "ws://localhost:3003/ws/chat"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            message = "Hello from test script!"
            print(f"> Sending: {message}")
            await websocket.send(message)
            
            response = await websocket.recv()
            print(f"< Received: {response}")
            
    except ConnectionRefusedError:
        print("Connection failed: Is the server running on port 3003?")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
