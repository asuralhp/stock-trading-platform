import re
import os
import chromadb
import GLOVAR

_client = None
_collection = None


def _create_client():
    """Create a Chroma client with best-effort compatibility across versions."""
    # Preferred: Settings with duckdb+parquet persistence
    try:
        from chromadb.config import Settings  # type: ignore

        return chromadb.Client(
            Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=GLOVAR.PATH_CHROMADB,
            )
        )
    except Exception:
        pass

    # Fallback: PersistentClient API (older pattern)
    try:
        return chromadb.PersistentClient(path=GLOVAR.PATH_CHROMADB)
    except Exception:
        pass

    # Last resort: basic Client
    return chromadb.Client()


def ensure_initialized():
    """Initialize client and collection once."""
    global _client, _collection
    if _client is None:
        _client = _create_client()

    if _collection is None:
        try:
            _collection = _client.get_collection(name=GLOVAR.NAME_COLLECTION)
        except Exception:
            _collection = _client.create_collection(name=GLOVAR.NAME_COLLECTION)
    
def import_documents(path):
    # import mdx file
    with open(path, 'r') as file:
        mdx_content = file.read()
        
    text = mdx_content.split('\n')
    text_list = [line.strip() for line in text if line.strip()]  # Remove empty lines
    return text_list



# Step 1: Preprocess the text (using the function defined previously)
def preprocess_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s.,!?\'\"-]', '', text).strip().lower()
    return text


# Step 3: Store vectors in Chroma
def store_in_chroma(text_list):
    ensure_initialized()
    ids = [f"doc_{i}" for i in range(len(text_list))]

    _collection.add(
        ids=ids,
        documents=text_list,
    )

def folder_walk(path_documents):
    text_list = []
    for root, dirs, files in os.walk(path_documents):
        for file in files:
            if file.endswith('.mdx'):
                file_path = os.path.join(root, file)
                text_list.extend(import_documents(file_path))
    return text_list


def batch_process(path_documents):
    text_list = folder_walk(path_documents)
    cleaned_texts = [preprocess_text(text) for text in text_list]
    store_in_chroma(cleaned_texts)
    return len(cleaned_texts)

def query_collection(question,n):
    ensure_initialized()
    result = _collection.query(
        query_texts=[question],
        n_results=n
    )
    return result

if __name__ == "__main__":
    batch_process(GLOVAR.PATH_DOCUMENTS)
    print("Texts have been processed and stored in Chroma!")
    question = "How many stationery does Mary have?"  
    print("Test Querying Chroma for:", question)
    result = query_collection(question,4)
    print("Query result:", result)  
    print("\n".join(result['documents'][0]))