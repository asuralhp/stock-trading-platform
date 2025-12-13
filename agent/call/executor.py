import GLOVAR



from .resolver import resolve
from .ag_order import action_order
from .ag_account import action_account
from .ag_watchlist import action_watchlist



def action_route(message, userUid):
    ag_code = resolve(message)['code']

    if ag_code == GLOVAR.AG_ACCOUNT:
        return action_account(message, userUid)
    elif ag_code == GLOVAR.AG_ORDER:
        return action_order(message, userUid)
    elif ag_code == GLOVAR.AG_WATCHLIST:
        return action_watchlist(message, userUid)

    return {"code":"error", "message":ag_code['message']}

def execute(form):
    if form == GLOVAR.ACTION_BUY:
        print(f"{form['code'], form['parameters']}")


def action_run(message, userUid):


    form = action_route(message, userUid)
    print(form)
    prompt = f"""
        Refine the input text to natural response
        biref one sentence

        Input: {form}
        """
    response = GLOVAR.AI_CLIENT.models.generate_content(
        model=GLOVAR.AI_MODEL,
        contents=prompt,
        )
    natrual = response.text
    print(natrual)
    return natrual


if __name__ == "__main__":
    # action_run("Buy 100 Google at $180")
    # action_run("Deposit 100$ to my account please")
    # action_run("Blah blah blah")
    
    # print(action_watchlist("Create Retail watchlists with US large-cap leaders", "github_33573968"))
    # print(action_watchlist("Add TGT to my Retail watchlist", "github_33573968"))
    print(action_watchlist("Remove my Retail watchlist", "github_33573968"))
        
    pass
