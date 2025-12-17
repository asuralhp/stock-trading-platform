COMFYUI_API_PORT = 8282
COMFYUI_API_URL = f"http://localhost:{COMFYUI_API_PORT}/prompt"  # Change if your endpoint differs
COMFYUI_WORKFLOW = "workflow_ipo.json"
# Use a raw string to avoid Python interpreting backslashes as escapes on Windows paths
COMFYUI_OUTPUT = r"C:\Users\Lau\Documents\ComfyUI\output"