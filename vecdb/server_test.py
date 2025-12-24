# test server
import requests

if __name__ == "__main__":
    vecdb_response = requests.get(f"http://localhost:3004/rerun")
    print("VecDB Server Response:", vecdb_response.text)
    # request to vecdb server 3004...
    question = "What is the fee of buying Option?"
    vecdb_response = requests.get(f"http://localhost:3004/retrieve?question={question}")
    print("VecDB Server Response:", vecdb_response.text)