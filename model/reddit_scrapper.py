from datetime import datetime, timezone
import os
import praw
import json

api_key_path = ".secrets/api_key.json"
with open(api_key_path) as f:
    api_key = json.load(f)
    
reddit = praw.Reddit(
    client_id=api_key["client_id"],
    client_secret=api_key["client_secret"],
    user_agent=api_key["user_agent"],
    username=api_key["username"],
    password=api_key["password"]
)

def fetch_reddit_posts(subreddit_name, limit=10):
    subreddit = reddit.subreddit(subreddit_name)
    posts = []
    for submission in subreddit.hot(limit=limit):
        created_iso = datetime.fromtimestamp(submission.created, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        posts.append({
            "title": submission.title,
            "score": submission.score,
            "id": submission.id,
            "url": submission.url,
            "comms_num": submission.num_comments,
            "created": created_iso,
            "body": submission.selftext
        })
    return posts

def fetch_reddit_post_by_keyword(subreddit_name, keyword, limit=10):
    subreddit = reddit.subreddit(subreddit_name)
    posts = []
    for submission in subreddit.search(keyword, limit=limit):
        created_iso = datetime.fromtimestamp(submission.created, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        posts.append({
            "title": submission.title,
            "score": submission.score,
            "id": submission.id,
            "url": submission.url,
            "comms_num": submission.num_comments,
            "created": created_iso,
            "body": submission.selftext
        })
    return posts

def fetch_reddit_posts_by_date(subreddit_name, start_date, end_date, limit=10, date_format="%Y-%m-%d"):
    """
    start_date and end_date can be:
      - strings in the format 'dd-mm-yyyy' (default)
      - integer epoch seconds
    """
    import httpx
    from datetime import datetime, timezone

    def to_epoch(val, end_of_day=False):
        if isinstance(val, int):
            return val
        if isinstance(val, str):
            # parse dd-mm-yyyy by default (xx-xx-xxxx)
            dt = datetime.strptime(val, date_format)
            if end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59)
            else:
                dt = dt.replace(hour=0, minute=0, second=0)
            dt = dt.replace(tzinfo=timezone.utc)
            return int(dt.timestamp())
        raise TypeError("start_date/end_date must be int (epoch) or str in format " + date_format)

    start_epoch = to_epoch(start_date, end_of_day=False)
    end_epoch = to_epoch(end_date, end_of_day=True)

    # use http to avoid 307 redirect from https -> http
    base = "http://api.pushshift.io/reddit/search/submission/"
    posts = []

    # allow redirects (safe here) and keep timeout
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        params = {
            "subreddit": subreddit_name,
            "after": start_epoch,
            "before": end_epoch,
            "size": limit
        }
        response = client.get(base, params=params)
        if response.status_code == 200:
            data = response.json().get("data", [])
            for item in data:
                posts.append({
                    "title": item.get("title"),
                    "score": item.get("score"),
                    "id": item.get("id"),
                    "url": item.get("url"),
                    "comms_num": item.get("num_comments"),
                    "created": item.get("created_utc"),
                    "body": item.get("selftext")
                })
    return posts

if __name__ == "__main__":
    subreddit_name = [
        "personalfinance",
        "investing",
        "ValueInvesting",
        "stocks",
        "StockMarket",
        "wallstreetbets"
        
    ]
    bearish_keywords = [
        "crisis",
        "bubble",
        "fraud",
        "crash",
        "downtrend",
        "bear",
        "decline",
        "sell",
        "weak",
        "burst",
        "collapse",
        "recession",
        "plunge",
        "slide",
        "retreat",
        "underperformance",
        "lose",
        "lost",
        "loss",
        "bear",
        "panic",
        "negative",
        "short",
        "downgrade",
        "drop",
        "deflation",
        "downturn",
        "correction",
        "uncertainty",
        "risk",
        "warning",
        "margin call",
        "overvaluation",
        "liquidation",
        "miss",
        "fear",
        "unemployment",
        "deficit",
        "job cuts",
        "slowdown",
        "retreat",
        "breakdown",
        "low",
        "problem",
        "issue",
        "down",
        "dead",
        "zero",
        "negative"
    ]
    
    bullish_keywords = [
        "boom",
        "growth",
        "profit",
        "surge",
        "uptrend",
        "bull",
        "increase",
        "buy",
        "strong",
        "rise",
        "expansion",
        "recovery",
        "climb",
        "advance",
        "gain",
        "outperformance",
        "win",
        "earn",
        "profit",
        "bull",
        "optimizm",
        "positive",
        "long",
        "upgrade",
        "increase",
        "inflation",
        "upturn",
        "rally",
        "reliable",
        "reward",
        "good",
        "chance",
        "valuation",
        "success",
        "confidence",
        "fix",
        "super",
        "job growth",
        "acceleration",
        "advance",
        "high",
        "solution",
        "opportunity",
        "up",
        "alive",
        "more",
        "positive"
    ]
    def start_scrape(keywords, group):
        for sub in subreddit_name:
            for keyword in keywords:
                posts = fetch_reddit_post_by_keyword(sub, keyword, limit=100000)
                path = os.path.join(group, sub, f"reddit_{sub}_posts_{keyword}.json")
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(posts, f, ensure_ascii=False, indent=4)
    
    # start_scrape(bearish_keywords, "bearish")
    start_scrape(bullish_keywords, "bullish")
    # keyword = "bubble"
    # posts = fetch_reddit_post_by_keyword(subreddit_name, keyword, limit=100000)
    # with open(f"bearish/reddit_{subreddit_name}_posts_{keyword}.json", "w", encoding="utf-8") as f:
    #     json.dump(posts, f, ensure_ascii=False, indent=4)