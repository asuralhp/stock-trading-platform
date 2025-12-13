#!/usr/bin/env python3
"""
Kafka Consumer Hello World Example
Receives messages from a Kafka topic
"""

from kafka import KafkaConsumer
import json
import time
import GLOVAR

def start_consume(topic):
    # Create a Kafka consumer
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=['localhost:9092'],
        # get the current messages only
        auto_offset_reset='latest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        group_id=GLOVAR.GROUP_ID
    )
    
    print("Kafka Consumer Started")
    print(f"Listening for {GLOVAR.COUNT_MESSAGE} messages on '{topic}' topic...\n")
    
    count = 0
    start_time = None

    try:
        for message in consumer:
            if start_time is None:
                start_time = time.time()
                print("First message received, timer started...")
            
            count += 1
            data = message.value
            print(f"Received: {data.get('symbol')} @ {data.get('price')} | Size: {data.get('size')} | UTC: {data.get('utc_timestamp')} | ID: {data.get('trade_id')} | Part: {message.partition} | Off: {message.offset}")

            if count >= GLOVAR.COUNT_MESSAGE:
                end_time = time.time()
                duration = end_time - start_time
                print(f"\nReceived {count} messages in {duration:.4f} seconds")
                print(f"Throughput: {count/duration:.2f} messages/sec")
                break

    except KeyboardInterrupt:
        print("\nConsumer closed by user")
        if start_time is not None:
            end_time = time.time()
            duration = end_time - start_time
            print(f"Received {count} messages in {duration:.4f} seconds")
            if duration > 0:
                print(f"Throughput: {count/duration:.2f} messages/sec")
    finally:
        consumer.close()
        print("Consumer closed successfully")

if __name__ == '__main__':
    start_consume(GLOVAR.SUB_TOPIC)
