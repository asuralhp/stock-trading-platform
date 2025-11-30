import yfinance as yf
import pandas as pd
import ta  # Technical Analysis library
import json

# symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "AMZN"]
symbols = ["AAPL"]



# Define the stock symbol and the time period
symbol = "AAPL"
start_date = "2007-10-26"  # 16 years ago from today
end_date = "2023-10-26"    # Today's date

# Fetch historical data
data = yf.download(symbol, start=start_date, end=end_date)

# show data head
print(data.head())

# Calculate Moving Averages
# data['MA_20'] = data['Close'].rolling(window=20).mean()
# data['MA_50'] = data['Close'].rolling(window=50).mean()

# Calculate RSI
# data['RSI'] = ta.momentum.RSIIndicator(data['Close']).rsi()

# Display the relevant columns
# result = data[['Close', 'MA_20', 'MA_50', 'RSI']]
# result = data[['Close']]
# print(result)