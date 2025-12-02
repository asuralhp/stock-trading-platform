from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn
import GLOVAR
from call.callrag import call_rag
from call.executor import action_run

app = FastAPI()

# Configure CORS to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Agent Backend is running"}



@app.websocket("/ws/{mode}")
async def websocket_endpoint(websocket: WebSocket, mode: str, userUid: Optional[str] = None):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            
            if mode == GLOVAR.CHAT_TYPE_AGENT:
                # Placeholder for agent logic
                data = action_run(data)
                print(f"Received in AGENT mode: done {data} ")
                await websocket.send_text(f"AGENT AI: done {data} for {userUid}")
            elif mode == GLOVAR.CHAT_TYPE_ASK:
                # Placeholder for ask logic
                context = call_rag(data).text
                print(f"Received in ASK mode: {data}")
                await websocket.send_text(f"ASK AI: {data} with {context}")
            else:
                await websocket.send_text(f"Unknown mode: {mode}")
                
    except Exception as e:
        print(f"WebSocket error ({mode}): {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=GLOVAR.PORT_SERVER, reload=True)
