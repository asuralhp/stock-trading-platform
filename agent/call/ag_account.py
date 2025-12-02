import GLOVAR

import os
import uuid

from datetime import datetime, timezone
from pymongo import ReturnDocument

from pydantic import BaseModel, Field
from typing import Literal

# Define the data model for the response
class ActionParameters(BaseModel):
    cash: int = Field(description="The cash of money to deposit or withdraw")

class AgentAction(BaseModel):
    code: Literal[GLOVAR.ACTION_DP, GLOVAR.ACTION_WD, "error"] = Field(description="The action code")
    parameters: ActionParameters

# Configure the API key


def coll_account_dpwd(account_data: dict, userUid: str ):
    """Insert a new account document into the accounts collection.

    Accepts `account_data` with optional keys:
      - userUid (preferred)
      - account_balance (initial balance, default 0)
      - account_id (optional; will be generated if missing)

    Returns the inserted_id on success or an error dict on failure.
    """
    try:
        collection = GLOVAR.MONGODB_COLL_ACCOUNT

        account_id = account_data.get("account_id") or f"acct_{uuid.uuid4().hex[:8]}"
        
        balance = float(account_data.get("account_balance") or account_data.get("balance") or 0)

        doc = {
            "account_id": account_id,
            "userUid": userUid,
            "account_balance": balance,
            "created_at": datetime.now(timezone.utc),
            "last_modified": datetime.now(timezone.utc),
        }

        result = collection.insert_one(doc)
        print(f"Account inserted with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"An error occurred while inserting the account: {e}")
        return {"status": "error", "reason": "exception", "detail": str(e)}


def coll_account_modify_balance(account_data: dict, userUid: str):
    """Modify an account's `account_balance`.

    Expects `account_data` to include at least:
      - action: 'deposit' or 'withdrawal'
      - amount / cash: numeric amount
      - account_id OR userUid (used to locate the account)

    Returns the updated account document on success or a dict with `status: 'error'` on failure.
    """
    try:
        collection = GLOVAR.MONGODB_COLL_ACCOUNT

        # Determine lookup key (prefer explicit identifiers in account_data, fallback to function param userUid)
        lookup = {}
        if account_data.get("account_id"):
            lookup["account_id"] = account_data.get("account_id")
        elif account_data.get("userUid"):
            lookup["userUid"] = account_data.get("userUid")
        elif account_data.get("user_id"):
            lookup["userUid"] = account_data.get("user_id")
        elif userUid:
            lookup["userUid"] = userUid
        else:
            return {"status": "error", "reason": "missing_account_identifier"}

        # Normalize amount
        amount = None
        if account_data.get("amount") is not None:
            amount = float(account_data.get("amount"))
        elif account_data.get("cash") is not None:
            amount = float(account_data.get("cash"))
        else:
            return {"status": "error", "reason": "missing_amount"}

        action = (account_data.get("action") or account_data.get("code") or "").lower()
        if action not in (GLOVAR.ACTION_WD, GLOVAR.ACTION_DP):
            return {"status": "error", "reason": "invalid_action"}

        # Read current balance first (by userUid/account_id)
        acc = collection.find_one(lookup, {"account_balance": 1})
        if not acc:
            return {"status": "error", "reason": "account_not_found"}

        current_balance = float(acc.get("account_balance") or 0)

        # Compute new balance
        if action == GLOVAR.ACTION_DP:
            new_balance = current_balance + amount
        else:  # withdrawal
            if current_balance < amount:
                return {"status": "error", "reason": "insufficient_funds", "current_balance": current_balance}
            new_balance = current_balance - amount

        # Persist new balance
        update = {
            "$set": {
                "account_balance": new_balance,
                "last_modified": datetime.now(timezone.utc)
            }
        }

        updated = collection.find_one_and_update(
            lookup,
            update,
            return_document=ReturnDocument.AFTER,
        )

        if not updated:
            return {"status": "error", "reason": "account_not_found"}

        return {"status": "success", "account": updated}

    except Exception as e:
        print(f"An error occurred while modifying account balance: {e}")
        return {"status": "error", "reason": "exception", "detail": str(e)}


def action_account(user_input: str, userUid: str ):
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
        if getattr(response, "parsed", None):
            print(f"Dict: {response.parsed.model_dump()}")
        else:
            print("Parsing failed or no parsed response returned by AI client.")
            return {"status": "error", "reason": "parse_failed", "raw": getattr(response, "text", None)}

        data = response.parsed.model_dump()

        # If parsed action is deposit/withdrawal, apply to account balance
        code = data.get("code")
        params = data.get("parameters") or {}

        # extract amount and validate
        amount = params.get("cash") if params.get("cash") is not None else params.get("amount")
        if amount is None:
            return {"status": "error", "reason": "missing_amount", "parsed": data}

        # normalize code to use known constants
        action_code = code
        if isinstance(code, str):
            lower_code = code.lower()
            if lower_code == "deposit":
                action_code = GLOVAR.ACTION_DP
            elif lower_code == "withdrawal":
                action_code = GLOVAR.ACTION_WD

        if action_code in (GLOVAR.ACTION_DP, GLOVAR.ACTION_WD):
            account_result = coll_account_modify_balance({
                "userUid": userUid,
                "action": action_code,
                "amount": amount,
            }, userUid)

            # If account not found, create one then retry
            if account_result.get("status") == "error" and account_result.get("reason") == "account_not_found":
                coll_account_dpwd({"userUid": userUid, "account_balance": 0}, userUid)
                account_result = coll_account_modify_balance({
                    "userUid": userUid,
                    "action": action_code,
                    "amount": amount,
                }, userUid)

            return {"parsed": data, "account_result": account_result}

        return {"status": "error", "reason": "invalid_action", "parsed": data}

    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "error", "reason": "exception", "detail": str(e)}



if __name__ == "__main__":
    # coll_account_modify_balance({
    #         "action": GLOVAR.ACTION_DP,
    #         "amount": 200,
    #     },"github_33573968"
    # )
    action_account("I want to deposit 1000 dollars", "github_33573968")
    # action_account("I want to withdraw 500 dollars")
    pass
