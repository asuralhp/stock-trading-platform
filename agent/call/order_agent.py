import GLOVAR

import os
from google import genai
from pydantic import BaseModel, Field
from typing import Literal

# Define the data model for the response
class ActionParameters(BaseModel):
    symbol: str = Field(description="the symbol of a listed stock")
    amount: int = Field(description="The amount or identifier, e.g., 'AAPL'")
    price: float = Field(description="The price value")

class AgentAction(BaseModel):
    code: Literal["buy", "sell", "error"] = Field(description="The action code")
    parameters: ActionParameters

# Configure the API key
api_key = os.environ.get("GEMINI_API_KEY")
ai_model = "gemini-2.5-pro"
def order(user_input: str):
    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
        Analyze the input text 
        If not matching, express uncertainty.
        If matched, decide which action to route to.

        Error:
        - Not Sure -> code: error

        Actions:
        - Buy Stock -> code: buy, parameters: symbol, amount, price
        - Sell Stock -> code: sell, parameters: symbol amount, price
        

        Input: {user_input}
        """

        response = client.models.generate_content(
            model=ai_model,
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
        return response.parsed.model_dump()

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":

    order("I want to buy 90 AAPL at 100 dollars")
    # order("Sell 20 MSFT at $200")
    # order("Blah blah blah")
    pass
