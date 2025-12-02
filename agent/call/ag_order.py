import GLOVAR

import os
from google import genai
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime, timedelta, timezone
import uuid

# Define the data model for the response
class ActionParameters(BaseModel):
    symbol: str = Field(description="the symbol of a listed stock")
    amount: int = Field(description="The amount or identifier, e.g., 'AAPL'")
    price: float = Field(description="The price value")

class AgentAction(BaseModel):
    code: Literal["buy", "sell", "error"] = Field(description="The action code")
    parameters: ActionParameters

# Configure the API key

def coll_order_insert(order_data: dict):
    try:
        collection = GLOVAR.MONGODB_COLL_ORDER

        # Local imports to avoid changing module-level imports

        # Build a normalized order document using sensible defaults matching your example row
        order_doc = {
            "order_id": order_data.get("order_id") or f"order_{uuid.uuid4().hex[:8]}",
            "userUid": order_data.get("userUid") or order_data.get("user_id") or "unknown_user",
            "symbol": order_data.get("symbol"),
            "order_type": order_data.get("order_type", "limit"),
            "action": order_data.get("action"),
            "amount": int(order_data["amount"]) if order_data.get("amount") is not None else None,
            "price": float(order_data["price"]) if order_data.get("price") is not None else None,
            # store UTC datetimes; MongoDB will serialize these to $date
            "order_date": order_data.get("order_date") or datetime.now(timezone.utc),
            # default trade_date to order_date + 30 minutes if not provided and status is completed
            "trade_date": order_data.get("trade_date") or (
                (order_data.get("order_date") or datetime.now(timezone.utc)) + timedelta(minutes=30)
                if order_data.get("status") == "completed" else None
            ),
            "status": order_data.get("status", "pending"),
            "session": order_data.get("session", "regular"),
            "time_in_force": order_data.get("time_in_force", "GTC"),
        }

        result = collection.insert_one(order_doc)
        print(f"Order inserted with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"An error occurred while inserting the order: {e}")

def action_order(user_input: str, user_id: str ):
    try:
        client = genai.Client(api_key=GLOVAR.AI_APIKEY)

        prompt = f"""
        Analyze the input text 
        If not matching, express uncertainty.
        If matched, decide which action to route to.

        Error:
        - Not Sure -> code: error,

        Actions:
        - Buy Stock -> code: buy, parameters: symbol, amount, price
        - Sell Stock -> code: sell, parameters: symbol amount, price
        

        Input: {user_input}
        """
        
        
        response = client.models.generate_content(
            model=GLOVAR.AI_MODEL,
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': AgentAction
            }
        )

        print(f"Input: {user_input}")
        # print(f"Output: {response.text}")
        if response.parsed:
            print(f"Dict: {response.parsed.model_dump()}")
        data = response.parsed.model_dump()
        coll_order_insert({
            "userUid": user_id,
            "action": 'buy' if data["code"] == GLOVAR.ACTION_BUY else 'sell' if data["code"] == GLOVAR.ACTION_SELL else 'error',
            "symbol": data["parameters"]["symbol"].upper(),
            "amount": data["parameters"]["amount"],
            "price": data["parameters"]["price"],
        })
        return data

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # coll_order_insert({
    #     "userUid": "user_123",
    #     "symbol": "AAPL",
    #     "action": "buy",
    #     "amount": 50,
    #     "price": 120.00,
    # })
    action_order("I want to buy 90 AAPL at 100 dollars", "user_123")
    # action_order("Sell 20 MSFT at $200", "user_456")
    # action_order("Blah blah blah", "user_789")
    pass
