import GLOVAR

import os
from google import genai
from pydantic import BaseModel, Field
from typing import Literal

# Define the data model for the response
class ResolveGroup(BaseModel):
    code: Literal["ag_order", "ag_account"] = Field(description="The action group code")
    message: Literal["message"] = Field(description="infomation message")
# Configure the API key


def resolve(user_input: str):
    try:
        client = genai.Client(api_key=GLOVAR.AI_APIKEY)

        prompt = f"""
        Analyze the user input to decide which action group to route to.
        
        Action Groups:
        - Order -> code: ag_order, description: buying or selling stock
        - Account -> code: ag_account, description: deposit or withdrawal account related like principle
        
        Input: {user_input}
        """

        response = client.models.generate_content(
            model=GLOVAR.AI_MODEL,
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ResolveGroup
            }
        )

        print(f"Input: {user_input}")
        if response.parsed:
            print(f"Dict: {response.parsed.model_dump()}")
        return response.parsed.model_dump()

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    resolve("I want to buy AAPL")
    resolve("Deposit 1000 dollars")
