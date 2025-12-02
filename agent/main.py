from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import GLOVAR
from callrag import call_rag
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
async def websocket_endpoint(websocket: WebSocket, mode: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            
            if mode == "agent":
                # Placeholder for agent logic
                print(f"Received in AGENT mode: {data}")
                await websocket.send_text(f"AGENT AI: {data}")
            elif mode == "ask":
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
