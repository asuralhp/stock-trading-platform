# test server
import requests

if __name__ == "__main__":
    # request to vecdb server 3004...
    question = "How many stationery does Mary have?"
    vecdb_response = requests.get(f"http://localhost:3004/retrieve?question={question}")
    print("VecDB Server Response:", vecdb_response.text)