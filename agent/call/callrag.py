import requests
import GLOVAR

url = f"http://{GLOVAR.VECDB_HOST}:{GLOVAR.VECDB_SERVER}/retrieve"


def call_rag(question):
    vecdb_response = requests.get(url, params={"question": question})
    print("VecDB Server Response:", vecdb_response.text)
    
    return vecdb_response
    
    
if __name__ == "__main__":
    question = "How many stationery does Mary have?"
    call_rag(question)