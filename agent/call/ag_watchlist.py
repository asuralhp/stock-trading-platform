import GLOVAR

from datetime import datetime, timezone
from typing import List

from google import genai
from pydantic import BaseModel, Field


class WatchlistStock(BaseModel):
    symbol: str = Field(description="Stock symbol, e.g. 'AAPL'")


class WatchlistItem(BaseModel):
    name: str = Field(description="Name of the watchlist, e.g. 'Technology'")
    stocks: List[WatchlistStock] = Field(description="List of stocks in this watchlist")


class WatchlistParameters(BaseModel):
    action: str = Field(description="'create', 'add_symbol', or 'remove_list'")
    watchlist_name: str | None = Field(default=None, description="Target watchlist name")
    symbols: List[str] | None = Field(default=None, description="Symbols to add when action = 'add_symbol'")
    watchlists: List[WatchlistItem] | None = Field(default=None, description="Watchlists to create when action = 'create'")


class WatchlistAction(BaseModel):
    code: str = Field(description="watchlist action group code, always 'watchlist'")
    parameters: WatchlistParameters


def _ensure_user_doc(collection, userUid: str):
    doc = collection.find_one({"userUid": userUid})
    if not doc:
        collection.insert_one({
            "userUid": userUid,
            "watchlist": [],
            "created_at": datetime.now(timezone.utc),
            "last_modified": datetime.now(timezone.utc),
        })


def add_watchlists_for_user(userUid: str, watchlists: List[WatchlistItem]):
    coll = GLOVAR.MONGODB_COLL_WATCHLIST
    _ensure_user_doc(coll, userUid)

    # Convert Pydantic models to plain dicts
    wl_dicts = [
        {
            "name": wl.name,
            "stocks": [{"symbol": s.symbol} for s in wl.stocks],
        }
        for wl in watchlists
    ]

    result = coll.update_one(
        {"userUid": userUid},
        {
            "$push": {"watchlist": {"$each": wl_dicts}},
            "$set": {"last_modified": datetime.now(timezone.utc)},
        },
    )
    return result.raw_result


def add_symbols_to_watchlist(userUid: str, watchlist_name: str, symbols: List[str]):
    coll = GLOVAR.MONGODB_COLL_WATCHLIST
    _ensure_user_doc(coll, userUid)

    # Ensure watchlist exists
    doc = coll.find_one({"userUid": userUid, "watchlist.name": watchlist_name})
    if not doc:
        # create an empty watchlist entry first
        coll.update_one(
            {"userUid": userUid},
            {
                "$push": {"watchlist": {"name": watchlist_name, "stocks": []}},
                "$set": {"last_modified": datetime.now(timezone.utc)},
            },
        )

    # Add symbols (avoid duplicates by using $addToSet with $each)
    result = coll.update_one(
        {"userUid": userUid, "watchlist.name": watchlist_name},
        {
            "$addToSet": {
                "watchlist.$.stocks": {
                    "$each": [{"symbol": s} for s in symbols]
                }
            },
            "$set": {"last_modified": datetime.now(timezone.utc)},
        },
    )
    return result.raw_result


def remove_watchlist_for_user(userUid: str, watchlist_name: str):
    coll = GLOVAR.MONGODB_COLL_WATCHLIST
    result = coll.update_one(
        {"userUid": userUid},
        {
            "$pull": {"watchlist": {"name": watchlist_name}},
            "$set": {"last_modified": datetime.now(timezone.utc)},
        },
    )
    return result.raw_result


def action_watchlist(user_input: str, userUid: str):
    """High-level entry similar to ag_order/ag_account.

    Uses the AI model to parse the intent into one of three actions:
      - create watchlist(s) with symbols
      - add symbol(s) to an existing watchlist
      - remove a watchlist
    """
    try:
        client = genai.Client(api_key=GLOVAR.AI_APIKEY)

        prompt = f"""
        You are a trading assistant managing stock watchlists.

        Understand the user's request and map it to one of these actions:

        1. Create watchlist(s) for the user, each with a name and a list of symbols.
           Example inputs:
           - "Create Technology, Healthcare, and Financials watchlists with typical sector leaders."
           - "Make a tech watchlist with AAPL, MSFT, NVDA and another watchlist for banks."

        2. Add specific symbol(s) to a specific existing watchlist for the user.
           Example inputs:
           - "Add TSLA and AMD to my Technology watchlist."
           - "Put JPM into my Financials list."

        3. Remove an entire watchlist for the user.
           Example inputs:
           - "Remove my Healthcare watchlist."
           - "Delete the Financials list."

        Output schema (JSON):
        - code: always "watchlist"
        - parameters:
            - action: one of "create", "add_symbol", "remove_list"
            - watchlist_name: required for add_symbol and remove_list
            - symbols: list of symbols, required for add_symbol
            - watchlists: list of watchlists (name + stocks) for create

        User input: {user_input}
        """

        response = client.models.generate_content(
            model=GLOVAR.AI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": WatchlistAction,
            },
        )

        print(f"Input: {user_input}")
        if getattr(response, "parsed", None):
            print(f"Dict: {response.parsed.model_dump()}")
        else:
            return {"status": "error", "reason": "parse_failed", "raw": getattr(response, "text", None)}

        data = response.parsed.model_dump()
        params = data.get("parameters", {})
        action = params.get("action")

        if action == "create":
            wl_items = [WatchlistItem(**wl) for wl in (params.get("watchlists") or [])]
            result = add_watchlists_for_user(userUid, wl_items)
            return {"status": "success", "operation": "create", "result": result, "parsed": data}

        if action == "add_symbol":
            name = params.get("watchlist_name")
            symbols = params.get("symbols") or []
            if not name or not symbols:
                return {"status": "error", "reason": "missing_name_or_symbols", "parsed": data}
            result = add_symbols_to_watchlist(userUid, name, symbols)
            return {"status": "success", "operation": "add_symbol", "result": result, "parsed": data}

        if action == "remove_list":
            name = params.get("watchlist_name")
            if not name:
                return {"status": "error", "reason": "missing_name", "parsed": data}
            result = remove_watchlist_for_user(userUid, name)
            return {"status": "success", "operation": "remove_list", "result": result, "parsed": data}

        return {"status": "error", "reason": "unknown_action", "parsed": data}

    except Exception as e:
        print(f"An error occurred in action_watchlist: {e}")
        return {"status": "error", "reason": "exception", "detail": str(e)}


if __name__ == "__main__":
    # Simple manual test examples (will hit real Mongo + AI)
    print(action_watchlist("Create Retail watchlists with US large-cap leaders", "github_33573968"))
    print(action_watchlist("Add TGT to my Retail watchlist", "github_33573968"))
    # print(action_watchlist("Remove my Retail watchlist", "github_33573968"))