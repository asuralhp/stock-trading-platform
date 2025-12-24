import requests
import json
import GLOVAR

# Test the server endpoints
BASE_URL = f"http://127.0.0.1:{GLOVAR.PORT_SERVER}"

def test_root():
    """Test the root endpoint"""
    print("Testing GET /")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_run():
    """Test the /run endpoint"""
    print("Testing POST /run")
    payload = {
        "positive_prompt": "Circle Internet Group, stable coin, fintech, blockchain, cryptocurrency",
        "slogan": "Test slogan for CRCL IPO"
    }
    
    response = requests.post(
        f"{BASE_URL}/run",
        headers={"Content-Type": "application/json"},
        json=payload
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    try:
        print("=== Starting Server Tests ===\n")
        test_root()
        test_run()
        print("=== Tests Completed ===")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Make sure the server is running on port 8000.")
    except Exception as e:
        print(f"Error: {e}")
