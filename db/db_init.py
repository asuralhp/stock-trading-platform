# db prototype tool : https://hackolade.com/
import csv
from datetime import datetime
import json
import pandas as pd
from pymongo import MongoClient, ASCENDING


client = MongoClient('mongodb://localhost:27017/') 


db_name = 'market_data'
client.drop_database(db_name)
db = client[db_name]


stock_prices_collection_name = 'stock_prices'


stock_prices_collection = db.create_collection(stock_prices_collection_name, timeseries={"timeField": "date"})





csv_file_path = './data_raw/historical.csv'  
data = pd.read_csv(csv_file_path)


data['date'] = pd.to_datetime(data['date'], format='%Y%m%d %H:%M:%S %Z')


data_dict = data.to_dict(orient='records')


if data_dict:  
    stock_prices_collection.insert_many(data_dict)
    
stock_prices_collection.create_index([('symbol', ASCENDING)])

print(f"Database '{db_name}' Inserted {len(data_dict)} records into {stock_prices_collection} and created an index on 'symbol'.")



ticker_all_collection_name = 'ticker_all'
ticker_all_collection = db[ticker_all_collection_name] 


json_file_path = './data_raw/ticker_all.json'  


with open(json_file_path, 'r') as file:
    data = json.load(file)
    
data_list = []
for value in data.values():
    value['symbol'] = value.pop('ticker')  
    data_list.append(value)
ticker_all_collection.insert_many(data_list)

print(f"Database '{db_name}' Inserted {len(data_list)} records into {ticker_all_collection}.")



json_file_path = './data_raw/ticker_info.json'  

ticker_info_collection_name = 'ticker_info'
ticker_info_collection = db[ticker_info_collection_name] 


with open(json_file_path, 'r') as file:
    data = json.load(file)

ticker_info_collection.insert_many(data)

print(f"Database '{db_name}' Inserted {len(data)} records into {ticker_info_collection}.")





csv_file_path = './data_raw/td_output.csv'  
ticker_all_collection = db['economic_calendar']   

with open(csv_file_path, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)   
    data = [row for row in reader]  
    
df = pd.DataFrame(data)
df.drop(columns=['tbd1', 'tbd2'], errors='ignore')
df = df.iloc[:, :-1]


ticker_all_collection.insert_many(df.to_dict('records'))



print(f"Database '{db_name}' Inserted {len(df)} records into economic_calendar.")



csv_file_path = './data_raw/market_indice.csv'  
ticker_all_collection = db['market_indice']   

with open(csv_file_path, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)   
    data = [row for row in reader]  

ticker_all_collection.insert_many(data)

print(f"Database '{db_name}' Inserted {len(data)} records into market_indice.")

#-------------------------------------------------------------------------------

db_name = 'account_data'
client.drop_database(db_name)
db = client[db_name]

user_collection_name = 'user'
watchlist_collection_name = 'watchlist'
margin_collection_name = 'accounts'
orders_collection_name = 'orders'
positions_collection_name = 'positions'


# Create collections
user_collection = db[user_collection_name]
watchlist_collection = db[watchlist_collection_name]
margin_collection = db[margin_collection_name]
# orders_collection = db[orders_collection_name]
with open("./schema/schema_orders.json", 'r') as file:
    schema = json.load(file)
orders_collection = db.create_collection(orders_collection_name, validator=schema)
positions_collection = db[positions_collection_name]


# Example user document with more fields
user_info = {
    "userUid": "johndoe1996",
    "username": "johndoe",
    "email": "john@example.com",
    "residentId": "HKG1234567",
    "avatar": "https://example.com/avatar.jpg",  
    "first_name": "John",
    "last_name": "Doe",
    "password_hash": "hashed_password_here", 
    "phone_number": "+852-34567890",
    "date_of_birth": "1990-01-01",
    "created_at": "2025-05-25T12:00:00Z",
    "last_login": "2025-05-25T12:00:00Z",
    "status": "active"  
}

watchlists = [
{
    "userUid": "johndoe",  # Reference to user
    "watchlist": [
        {
            "name": "WatchA",
            "stocks": [
                {"symbol": "AAPL"},
                {"symbol": "NVDA"}
            ]
        },
        {
            "name": "WatchB",
            "stocks": [
                {"symbol": "TSLA"},
                {"symbol": "AMZN"}
            ]
        },
        {
            "name": "WatchC",
            "stocks": [
                {"symbol": "GOOGL"},
                {"symbol": "NFLX"}
            ]
        }
    ]
},
{
    "userUid": "github_33573968",  # Reference to user
    "watchlist": [
        {
            "name": "WatchA",
            "stocks": [
                {"symbol": "AAPL"},
                {"symbol": "NVDA"}
            ]
        },
        {
            "name": "WatchB",
            "stocks": [
                {"symbol": "TSLA"},
                {"symbol": "AMZN"}
            ]
        },
        {
            "name": "WatchC",
            "stocks": [
                {"symbol": "GOOGL"},
                {"symbol": "NFLX"}
            ]
        }
    ]
}
              ]

margin_accounts = [{
    "userUid": "johndoe",
    "account_balance": 15000.00,
    "margin_limit": 30000.00,
    "margin_used": 5000.00,
    "interest_rate": 0.05,  
    "created_at": "2025-05-25T12:00:00Z",
    "last_updated": "2025-05-25T12:00:00Z",
    "status": "active"
},
{
    "userUid": "github_33573968",
    "account_balance": 20000.00,
    "margin_limit": 40000.00,
    "margin_used": 8000.00,
    "interest_rate": 0.04,
    "created_at": "2025-05-25T12:00:00Z",
    "last_updated": "2025-05-25T12:00:00Z",
    "status": "active"
}]


orders = [
    {
        "order_id": "order_001",
        "userUid": "johndoe",  # Reference to user
        "symbol": "AAPL",
        "order_type": "limit",  # limit or market
        "action": "buy",  # buy or sell
        "amount": 10,
        "price": 150.00,
        "order_date": datetime.strptime("2025-05-25T12:00:00Z", "%Y-%m-%dT%H:%M:%SZ"),
        "trade_date": datetime.strptime("2025-05-25T12:30:00Z", "%Y-%m-%dT%H:%M:%SZ"),
        "status": "completed",  # e.g., pending, completed, canceled
        "session": "regular",  # e.g., regular, after-hours
        "time_in_force": "GTC"  # e.g., GTC, FOK, IOC
    },
    {
        "order_id": "order_002",
        "userUid": "johndoe",  # Reference to user
        "symbol": "TSLA",
        "order_type": "market",
        "action": "sell",
        "amount": 5,
        "price": None,  # No price for market orders
        "order_date": datetime.strptime("2025-05-25T12:30:00Z", "%Y-%m-%dT%H:%M:%SZ") ,
        "trade_date": None,
        "status": "pending",
        "session": "regular",
        "time_in_force": "DAY"
    }
]


positions = {
    "userUid": "johndoe",  
    "symbol": "AAPL",
    "cost": 145.00, 
    "quantity": 10,
}


user_collection.insert_one(user_info)
margin_collection.insert_many(margin_accounts)
orders_collection.insert_many(orders)
watchlist_collection.insert_many(watchlists)
positions_collection.insert_one(positions)
print(
    f"Database '{db_name}' created with collections "
    f"'{user_collection_name}', '{margin_collection_name}', "
    f"'{orders_collection_name}', and '{watchlist_collection_name}'."
    f"'{positions_collection_name}'"
)




#-------------------------------------------------------------------------------
