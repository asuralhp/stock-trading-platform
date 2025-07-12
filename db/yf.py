import yfinance as yf
import json

symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "AMZN"]
ticker_info = []
for symbol in symbols:
    stock = yf.Ticker(symbol)
    ticker_info.append(stock.info)

with open ("./data_raw/ticker_info.json", "w") as file:
    json.dump(ticker_info, file, indent=4)
    
