import pandas as pd


def ohlc_template(symbol, tickerid, timestamp, formattime, endtime, open_, high, low, close, volume, wap, count):
    return {
        "symbol": symbol,
        "tickerid": tickerid,
        "timestamp": timestamp,
        "time": formattime,
        "endtime": endtime,
        "open": open_,
        "high": high,
        "low": low,
        "close": close,
        "volume": int(volume),
        "wap": float(wap),
        "count": count
    }

# Example usage
# data = ohlc_template(symbol, time, formattime, open_, high, low, close, volume, wap, count)

def normalize_100_ratio(ratio):
    result = 100 - (100 / (1 + ratio))
    return result

def avg(list_value):
    result = sum(list_value) / len(list_value)
    return result

def ti_rsi_formal(list_close):
    gain_total = 0.0
    change_total = 0.0
    window = len(list_close)
    period = window - 1
    for i in range(1, window):
        diff = list_close[i] - list_close[i-1]
        print(diff)
        gain_total += max(diff, 0)
        change_total += abs(diff)

    gain_avg = gain_total / period
    change_avg = change_total / period


    if change_avg == 0 :
        rsi = 50
    else :
        rsi = gain_avg / change_avg * 100
    print("RSI: ",rsi)
    return rsi
    
def ti_rsi(list_close, period=14):
    gain_avg = 0.0
    loss_avg = 0.0
    gain_num = 0
    loss_num = 0
    window = len(list_close)
    
    if window < period:
        raise ValueError("Not enough data points to calculate RSI.")
    
    # Calculate gains and losses
    for i in range(1, period + 1):
        diff = list_close[i] - list_close[i - 1]
        # print(f"{diff} = {list_close[i]} - {list_close[i - 1]}")
        if diff >= 0:
            gain_avg += diff
            gain_num += 1
        else:
            loss_avg -= diff
            loss_num += 1

    print(f"total, g : {gain_avg} / {period} l: {loss_avg} / {period}")
    # Average gains and losses
    gain_avg = gain_avg / period
    loss_avg = loss_avg / period
    print(f"g : {gain_avg} l: {loss_avg}")
    
    if loss_avg == 0:
        return 100  # RSI is 100 if there are no losses

    rs = gain_avg / loss_avg
    rsi = 100 - (100 / (1 + rs))

    return rsi


def calculate_rsi(prices, period=7):
    """
    Calculates the Relative Strength Index (RSI) for a given list of prices.
    """
    if len(prices) < period + 1:
        return None # Not enough data to calculate RSI

    # Create a pandas Series from the price list
    series = pd.Series(prices)

    # Calculate price differences
    delta = series.diff()

    # Separate gains and losses
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    # Calculate the initial average gain and loss
    # For the first calculation, it's a simple moving average
    avg_gain = gain.rolling(window=period, min_periods=period).mean().dropna()
    avg_loss = loss.rolling(window=period, min_periods=period).mean().dropna()

    # Calculate Relative Strength (RS)
    rs = avg_gain / avg_loss

    # Calculate RSI
    rsi = 100 - (100 / (1 + rs))
    
    # Return the last calculated RSI value
    return rsi.iloc[-1] if not rsi.empty else None
# def ti_rsi(list_close, window):
#     gain_avg = 0
#     loss_avg = 0
#     num = len(list_close)
#     for i in range(window, num) :
#         print(f"i : {i}")
#         for j in range(i - window, i):
#             diff = list_close[j] - list_close[j-1]
#             print(f"    j : {j}, diff : {diff}")
#             if diff  >= 0 :
#                 gain_avg += diff
#             else :
#                 loss_avg += abs(diff)
#     print(f"""
#           gain_avg: {gain_avg}
#           loss_avg: {loss_avg}
          
#           """)
    

def ti_template(rsi):
    return {
        "rsi": rsi,
    }
    
    
if __name__ == '__main__':
    list_close = [
        574.82,
        574.82,
        574.71,
        574.74,
        574.65,
        574.75,
        574.88,
        574.83,
    ]
    
    
    rsi = ti_rsi(list_close,7)
    # rsi_formal = ti_rsi_formal(list_close)
    # calculate_rsi_val = calculate_rsi(list_close)
    print(rsi)
    # print(rsi_formal)
    # print(calculate_rsi_val )
    pass