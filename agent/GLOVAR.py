import os
import json
from google import genai

PORT_SERVER = 3003
VECDB_HOST = os.getenv("VECDB_HOST", "localhost")
VECDB_SERVER = int(os.getenv("VECDB_PORT", "3004"))

CHAT_TYPE_ASK = 'ask'
CHAT_TYPE_AGENT = 'agent'

AG_ORDER = 'ag_order'
AG_ACCOUNT = 'ag_account'
AG_WATCHLIST = 'ag_watchlist'

ACTION_BUY = 'buy'
ACTION_SELL = 'sell'

ACTION_WD = 'withdrawal'
ACTION_DP = 'deposit'

# AI_MODEL = "gemini-2.5-pro"
# AI_MODEL = "gemini-2.5-flash"
AI_MODEL = "gemini-2.5-flash-lite"

with open('.secret/apikey.json', 'r') as json_file:
    loaded_data = json.load(json_file)
AI_APIKEY = loaded_data['apikey']


AI_CLIENT = genai.Client(api_key=AI_APIKEY)
from pymongo import MongoClient
# Make MongoDB host/port configurable for containerized deployments
MONGODB_HOST = os.getenv("MONGODB_HOST", "localhost")
MONGODB_PORT = int(os.getenv("MONGODB_PORT", "27017"))
MONGODB_URI = os.getenv("MONGODB_URI", f'mongodb://{MONGODB_HOST}:{MONGODB_PORT}/')

# Create Mongo client (will attempt to connect lazily)
MONGODB_CLIENT = MongoClient(MONGODB_URI)

# Create or access a database
MONGODB_DB_ACCOUNT = MONGODB_CLIENT['account_data']  # Database name

MONGODB_COLL_WATCHLIST = MONGODB_DB_ACCOUNT['watchlist']
MONGODB_COLL_ACCOUNT = MONGODB_DB_ACCOUNT['accounts']
MONGODB_COLL_ORDER = MONGODB_DB_ACCOUNT['orders']