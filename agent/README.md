# Agent Backend

This is the Python backend for the Agentic Action and Popup Chat application.

## Setup

1.  **Create Virtual Environment:**
    ```bash
    python -m venv venv
    ```

2.  **Activate Virtual Environment:**
    *   Windows: `.\venv\Scripts\activate`
    *   Mac/Linux: `source venv/bin/activate`

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

The server is configured to run on port **3003**.

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 3003 --reload
```

## Endpoints

*   `GET /`: Health check.
*   `POST /agent/action`: Endpoint for agentic actions.
*   `WS /ws/chat`: WebSocket endpoint for popup chat.
