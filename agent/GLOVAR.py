import os
import json
from google import genai

PORT_SERVER = 3003
VECDB_SERVER = 3004

CHAT_TYPE_ASK = 'ask'
CHAT_TYPE_AGENT = 'agent'

AG_ORDER = 'ag_order'
AG_ACCOUNT = 'ag_account'

ACTION_BUY = 'buy'
ACTION_SELL = 'sell'



# AI_MODEL = "gemini-2.5-pro"
AI_MODEL = "gemini-2.5-flash"

with open('.secret/apikey.json', 'r') as json_file:
    loaded_data = json.load(json_file)
AI_APIKEY = loaded_data['apikey']

print('API KEY:', AI_APIKEY)

AI_CLIENT = genai.Client(api_key=AI_APIKEY)