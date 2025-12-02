import GLOVAR

import os

from pydantic import BaseModel, Field
from typing import Literal

# Define the data model for the response
class ActionParameters(BaseModel):
    cash: int = Field(description="The cash of money to deposit or withdraw")

class AgentAction(BaseModel):
    code: Literal["deposit", "withdrawal", "error"] = Field(description="The action code")
    parameters: ActionParameters

# Configure the API key


def action_account(user_input: str):
    try:


        prompt = f"""
        Analyze the input text 
        If not matching, express uncertainty.
        If matched, decide which action to route to.

        Error:
        - Not Sure -> code: error,

        Actions:
                - Deposit -> code: deposit, parameters: cash
                - Withdrawal -> code: withdrawal, parameters: cash


        Input: {user_input}
        """

        response = GLOVAR.AI_CLIENT.models.generate_content(
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
        return response.parsed.model_dump()

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":

    action_account("I want to deposit 1000 dollars")
    action_account("I want to withdraw 500 dollars")
    pass
