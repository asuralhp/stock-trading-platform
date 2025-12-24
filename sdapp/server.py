from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import uvicorn
import GLOVAR
from main import run_workflow


class RunRequest(BaseModel):
    positive_prompt: str
    slogan: str


app = FastAPI(title="ComfyUI Workflow Runner")


@app.get("/")
def root():
    return {"status": "ok", "message": "ComfyUI workflow runner ready"}


@app.post("/run")
def run(req: RunRequest):
    try:
        resp, filename_prefix, copied_path = run_workflow(req.positive_prompt, req.slogan)
        try:
            resp_json = resp.json()
        except Exception:
            resp_json = getattr(resp, "text", None)

        return {
            "status_code": getattr(resp, "status_code", None),
            "response": resp_json,
            "filename_prefix": filename_prefix,
            "copied_path": copied_path,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":

    port = int(os.getenv("PORT", os.getenv("COMFYUI_PORT", str(GLOVAR.PORT_SERVER))))
    uvicorn.run(app, host="127.0.0.1", port=GLOVAR.PORT_SERVER, reload=True)
