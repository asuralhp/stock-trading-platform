import GLOVAR

import asyncio
import websockets

async def test_ask(message, chat_type):


    uri = f"ws://localhost:{GLOVAR.PORT_SERVER}/ws/{chat_type}"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:

            print(f"> Sending: {message}")
            await websocket.send(message)
            
            response = await websocket.recv()
            print(f"< Received: {response}")
            
    except ConnectionRefusedError:
        print("Connection failed: Is the server running on port 3003?")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_ask("Buy 100 Nvidia stock at $189.99  ",GLOVAR.CHAT_TYPE_AGENT))
