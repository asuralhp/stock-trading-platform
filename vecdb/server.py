from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse

from main import query_collection, batch_process, ensure_initialized
import GLOVAR

app = FastAPI(title="VecDB RAG", version="1.0")


@app.on_event("startup")
async def startup_event():
    ensure_initialized()


@app.get("/")
async def root():
    return {"message": "VecDB RAG server is running", "port": GLOVAR.PORT_SERVER}


@app.get("/retrieve", response_class=PlainTextResponse)
async def retrieve(question: str = Query("Give me guides"), n: int = Query(4, ge=1, le=50)):
    try:
        result = query_collection(question, n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    docs = (result or {}).get("documents") or []
    if not docs or not docs[0]:
        return ""
    # Return plain text with newline separators for backward compatibility
    return "\n".join(docs[0])


@app.post("/rerun")
async def rerun():
    try:
        count = batch_process(GLOVAR.PATH_DOCUMENTS)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch process failed: {e}")

    return {"message": "Documents processed and stored", "count": count}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=GLOVAR.PORT_SERVER)