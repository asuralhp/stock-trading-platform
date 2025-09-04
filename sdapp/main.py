from random import randint
import requests
import json

# ComfyUI API endpoint
COMFYUI_API_PORT = 8282
COMFYUI_API_URL = f"http://localhost:{COMFYUI_API_PORT}/prompt"  # Change if your endpoint differs
COMFYUI_WORKFLOW = "workflow_ipo.json"
# Load the workflow from workflow_ipo.json
with open(f"./{COMFYUI_WORKFLOW}", "r") as f:
    workflow = json.load(f)

# Wrap the workflow in a dict with key "prompt"
payload = {"prompt": workflow}

workflow['20']['inputs']['text'] = "masterpiece hot fire burn"
workflow['29']['inputs']['text'] = "$EDF IPO is a great opportunity for investors"
workflow['17']['inputs']['seed'] = randint(0, 999999999999999)


response = requests.post(COMFYUI_API_URL, json=payload)

print("Status Code:", response.status_code)
print("Response:", response.json())