import GLOVAR

import asyncio
import websockets
import time
async def test_ask(message, chat_type, user_uid):


    uri = f"ws://localhost:{GLOVAR.PORT_SERVER}/ws/{chat_type}?userUid={user_uid}"
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
    asyncio.run(test_ask("Mary pen?", GLOVAR.CHAT_TYPE_ASK, "user123"))
    # asyncio.run(test_ask("Buy 100 Nvidia stock at $189.99  ",GLOVAR.CHAT_TYPE_AGENT, "abc123"))
    # asyncio.run(test_ask("Sell 10 Tesla stock at $222.99  ",GLOVAR.CHAT_TYPE_AGENT, "abc123"))
    # time.sleep(4)
    # asyncio.run(test_ask("Withdrawal $2202.99 out of my account ",GLOVAR.CHAT_TYPE_AGENT, "abc123"))
    # asyncio.run(test_ask("Deposit $330.30 to the margin account ",GLOVAR.CHAT_TYPE_AGENT, "abc123"))
