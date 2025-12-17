from random import randint
import requests
import json
import GLOVAR
import os
import time
import uuid
import glob
import shutil


def run_workflow(positive_prompt: str, slogan: str):
    """Load the workflow, update prompts/seeds safely, POST to ComfyUI and return the response.

    This function only updates nodes if they exist and have an 'inputs' dict.
    """
    # Load the workflow from configured file
    with open(f"./{GLOVAR.COMFYUI_WORKFLOW}", "r") as f:
        workflow = json.load(f)

    # Update nodes that exist in the provided workflow JSON.
    # Example mapping: node '6' -> positive prompt, node '11' -> negative prompt
    updates = (('6', positive_prompt), ('11', slogan))

    for node_key, text in updates:
        if node_key in workflow and isinstance(workflow[node_key].get('inputs'), dict):
            workflow[node_key]['inputs']['text'] = text
        else:
            print(f"Warning: node {node_key} not found or missing inputs in workflow")

    # seed node (if exists)
    seed_node = '3'
    if seed_node in workflow and isinstance(workflow[seed_node].get('inputs'), dict):
        workflow[seed_node]['inputs']['seed'] = randint(0, 999999999999999)
    else:
        print(f"Warning: seed node {seed_node} not found or missing inputs in workflow")

    # generate a unique filename prefix and set it on node '9' if present
    filename_prefix = uuid.uuid4().hex
    node_9 = '9'
    if node_9 in workflow and isinstance(workflow[node_9].get('inputs'), dict):
        workflow[node_9]['inputs']['filename_prefix'] = filename_prefix
    else:
        print(f"Warning: node {node_9} not found or missing inputs in workflow")

    # Wrap the workflow in a dict with key "prompt"
    payload = {"prompt": workflow}

    # POST to ComfyUI API
    response = requests.post(GLOVAR.COMFYUI_API_URL, json=payload)

    print("Status Code:", response.status_code)
    try:
        print("Response:", response.json())
    except Exception:
        print("Response content:", response.text)

    # wait up to 60 seconds for an output file starting with the generated prefix
    copied_path = None
    try:
        output_dir = GLOVAR.COMFYUI_OUTPUT
        wait_until = time.time() + 60
        while time.time() < wait_until:
            pattern = os.path.join(output_dir, f"{filename_prefix}*")
            matches = glob.glob(pattern)
            if matches:
                src = matches[0]
                dest_dir = os.path.join(os.getcwd(), "output")
                os.makedirs(dest_dir, exist_ok=True)
                dest = os.path.join(dest_dir, os.path.basename(src))
                try:
                    shutil.copy2(src, dest)
                    copied_path = dest
                    print(f"Found and copied output file: {dest}")
                except Exception as e:
                    print(f"Failed to copy file {src} -> {dest}: {e}")
                break
            time.sleep(1)
        else:
            print(f"Timed out waiting for output file with prefix {filename_prefix} in {output_dir}")
    except Exception as e:
        print(f"Error while searching for output file: {e}")

    # return response, the generated filename prefix and the copied path (or None)
    return response, filename_prefix, copied_path


if __name__ == "__main__":
    positive = (
        "Circle Internet Group, stable coin, fintech, blockchain, cryptocurrency, digital payments, "
        "financial inclusion, mobile banking, innovative technology, secure transactions, "
        "user-friendly platform, global reach, regulatory compliance, partnerships with banks and telecoms, "
        "financial services for the unbanked, investment opportunities, growth potential, IPO success factors"
    )

    slogan = "$CRCL IPO is a great opportunity for investors"

    run_workflow(positive, slogan)