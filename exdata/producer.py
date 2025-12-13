#!/usr/bin/env python3
"""
Kafka Producer Hello World Example
Sends messages to a Kafka topic
"""

from kafka import KafkaProducer
import json
import time
import random
from datetime import datetime, timezone
from pathlib import Path
import GLOVAR
import yfinance as yf


def generate_ticks(count: int = 25):
    # enumlate few symbols
    target_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
    symbols = target_symbols

    # Create a map of symbol -> price from yfinance
    symbol_prices = {}
    print("Fetching previous day prices from yfinance...")
    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            # Try to get previous close from fast_info
            if hasattr(ticker, 'fast_info') and 'previous_close' in ticker.fast_info:
                price = ticker.fast_info['previous_close']
                symbol_prices[sym] = float(price)
            else:
                # Fallback to history
                hist = ticker.history(period="5d")
                if not hist.empty:
                    symbol_prices[sym] = float(hist['Close'].iloc[-1])
            
            if sym in symbol_prices:
                print(f"  {sym}: {symbol_prices[sym]:.2f}")
        except Exception as e:
            print(f"  {sym}: Error fetching price - {e}")

    now = time.time()
    ticks = []
    for _ in range(count):
        sym = random.choice(symbols)
        base_price = symbol_prices.get(sym, 150.00) # Default fallback
        
        # Small jitter (+/- 0.5%) to emulate live ticks
        jitter = 1 + random.uniform(-0.005, 0.005)
        price = round(base_price * jitter, 2)
        size = random.randrange(10, 5000, 10)
        now += random.uniform(0.01, 0.5)
        ticks.append({
            'symbol': sym,
            'price': price,
            'size': size,
            'timestamp': now,
            'utc_timestamp': datetime.fromtimestamp(now, timezone.utc).isoformat(),
            'trade_id': random.randint(1_000_000, 9_999_999)
        })

    return ticks

def main():
    # csv_path = Path(__file__).parent / "nasdaq_screener_1765385949100.csv"
    ticks = generate_ticks(count=GLOVAR.COUNT_MESSAGE)

    # Create a Kafka producer
    producer = KafkaProducer(
        bootstrap_servers=['127.0.0.1:9092'],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    
    print("Kafka Producer Started")
    print("Sending tick trades to symbol-specific topics...\n")

    start_time = time.time()

    def on_send_success(record_metadata, i, tick):
        # print(f"Tick {i+1} ({tick['symbol']} @ {tick['price']}) sent to topic '{record_metadata.topic}' "
        #       f"partition {record_metadata.partition} "
        #       f"at offset {record_metadata.offset}")
        pass

    # Ensure ticks are sorted by time
    ticks.sort(key=lambda x: x['timestamp'])
    
    for i, tick in enumerate(ticks):
        # Simulate time delay between trades (Fast/Normal pattern)
        if i % 10 == 0:
            time.sleep(0.5)  # Normal


        # Update timestamp to current real time (live feed simulation)
        now = time.time()
        tick['timestamp'] = now
        tick['utc_timestamp'] = datetime.fromtimestamp(now, timezone.utc).isoformat()

        topic_name = f"tick-{tick['symbol']}"
        try:
            producer.send(topic_name, value=tick).add_callback(on_send_success, i, tick)
            print(f"Sent: {tick['symbol']} | Price: {tick['price']}", flush=True)
        except Exception as e:
            print(f"\nConnection Error: {e}")
            print("Please ensure your Kafka broker is running at 127.0.0.1:9092")
            break
    
    print("All messages queued. Waiting for Kafka broker to acknowledge (flushing)...")
    producer.flush()
    end_time = time.time()
    duration = end_time - start_time
    print(f"\nSent {len(ticks)} messages in {duration:.4f} seconds")
    print(f"Throughput: {len(ticks)/duration:.2f} messages/sec")

    producer.close()
    print("\nProducer closed successfully")

if __name__ == '__main__':
    main()
