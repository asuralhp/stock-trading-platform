
from datetime import datetime, timedelta
import time
from GLOBAL import GLOVAR
from GLOBAL.GLOFUNC import current_datetime_utc, dt_to_timestamp
from GLOBAL.MGDBFUNC import close_mgdb_client, delete_by_id, find_one_ts_mgdb, init_coll, init_mgdb_client, init_mgdb_db, insert_one_dict_mgdb, update_dict_mgdb
from GLOBAL.QUANTFUNC import ohlc_template, ti_rsi, ti_template
from db.ts_sec_5 import coll_sec_5


db_client = init_mgdb_client(GLOVAR.URL_MGDB)
db = init_mgdb_db(db_client, GLOVAR.MGDB_REALTIME_DATA)
coll_rt_agg_min_1 = init_coll(db, GLOVAR.MGDB_COLL_RT_AGG_MIN_1, 'minutes', isRecreate=GLOVAR.ISRECREATE_MGDB_COLL_RT_AGG_MIN_1)


def pipeline_agg_sec_5_to_min_1(symbol, time_start, time_end):
    
    pipeline = [
         {
            # Filter documents based on the time range
            "$match": {
                "time": {
                    "$gte": time_start,
                    "$lt": time_end
                },
                "symbol": symbol
                
            }
        },
        {
            # It's a good practice to sort by time before grouping
            # to ensure $first and $last accumulators are correct.
            "$sort": {
                "timestamp": 1
            }
        },
        
        {
            # Group by symbol and minute
            "$group": {
                "_id": {
                    "symbol": "$symbol",
                    "time": {
                        "$dateTrunc": {
                            "date": "$time",
                            "unit": "minute",
                            "binSize": 1
                        }
                    }
                },
                # Calculate the OHLC values for the 1-minute bar
                "tickerid": {"$last": "$tickerid"},
                "open": {"$first": "$open"},
                "high": {"$max": "$high"},
                "low": {"$min": "$low"},
                "close": {"$last": "$close"},
                "volume": {"$sum": "$volume"},
                "twp": {"$sum": {"$multiply": ["$wap", "$volume"]}},
                "count": {"$sum": '$count'}
            }
        },
        
        {
            # Sort the final results by time for clear presentation.
            "$sort": {
                "_id.time": -1
            }
        }
    ]
    
    return pipeline
    
def log_agg_min_1(doc):
    print(f"Time: {doc['_id']['time']}, "
        f"Symbol: {doc['_id']['symbol']}, "
        f"Open: {doc['open']}, "
        f"High: {doc['high']}, "
        f"Low: {doc['low']},  "
        f"Close: {doc['close']},  "
        f"Volume: {doc['volume']} "
        f"WAP: {doc['twp'] / doc['volume']} "
        f"Count: {doc['count']} "
        )
        


def get_agg_min_1_many(symbol, window, time_current, coll):
    time_start = time_current - timedelta(minutes=window)
    result = list(coll.find({'symbol': symbol, 'time': {'$gt': time_start, '$lte': time_current}}))
    
    return result

def agg_sec_5_to_min_1(symbol, coll_sec_5):
    
    time_now = current_datetime_utc()
    print(f'current :{time_now}')
    time_start = time_now.replace(second=0, microsecond=0)
    time_end = time_start + timedelta(minutes=1)

    print(f"floor : {time_start} to {time_end}")
    
    # init pipeline
    pipeline = pipeline_agg_sec_5_to_min_1(symbol, time_start, time_end)
    list_agg_min_1 = list(coll_sec_5.aggregate(pipeline))
    
    
    # if empty means the pre min not finished yet 
    if len(list_agg_min_1) <= 0:
        print(f"--- Got {len(list_agg_min_1)}, Start Pre Aggregated 1-Minute OHLC Data ---")
        time_start  = time_start - timedelta(minutes=1)
        time_end    = time_end - timedelta(minutes=1)
        
        print(f"fixed time: {time_start} to {time_end}")
        
        # init pipeline for previous min
        pipeline    = pipeline_agg_sec_5_to_min_1(symbol, time_start, time_end)
        list_agg_min_1 = list(coll_sec_5.aggregate(pipeline))

    elif len(list_agg_min_1) == 1:
        print("--- Aggregated 1-Minute OHLC Data ---")
        
    else:
        print(f"--- Error Got {len(list_agg_min_1)} Aggregated 1-Minute OHLC Data ---")
        return
    
    
    agg_min_1 = list_agg_min_1[0]
    # log_agg_min_1(agg_min_1)
    
    # composing data form
    wap = agg_min_1['close'] if agg_min_1['volume'] == 0 else agg_min_1['twp'] / agg_min_1['volume']
    data = ohlc_template(
        agg_min_1['_id']['symbol'],
        agg_min_1['tickerid'],
        dt_to_timestamp(agg_min_1['_id']['time']),
        agg_min_1['_id']['time'],
        -1,
        agg_min_1['open'],
        agg_min_1['high'],
        agg_min_1['low'],
        agg_min_1['close'],
        agg_min_1['volume'],
        wap,
        agg_min_1['count'],
    )
    
    
    # period = 7 # 7 + current bar
    # list_window_agg_min_1 = get_agg_min_1_many(symbol, period + 1, time_start, coll_rt_agg_min_1)
    # print(f'---- list_window_agg_min_1 ---- {len(list_window_agg_min_1)}')
    # print(time_start)
    # print(list_window_agg_min_1[0]['time'])    
    # print(list_window_agg_min_1[-1]['time'])    

    # list_close = [tick['close'] for tick in list_window_agg_min_1]

    # rsi = ti_rsi(list_close, 7)
    # print(f"RSI : {rsi}")
    # data_ti = ti_template(rsi)
    # data.update(data_ti)   


    print("Data : ",data)
    
    last_agg_min_1 = find_one_ts_mgdb(symbol, time_start, coll_rt_agg_min_1)
    if len(last_agg_min_1) <= 0:
        print(f"--- Inserting New 1-Minute OHLC Data for {time_start} ---")
        
    else:
        print(f"--- Found Exist 1-Minute OHLC Data for {time_start} ---")
        print(last_agg_min_1[0])
        delete_by_id(last_agg_min_1[0]['_id'], coll_rt_agg_min_1)
        
    result = insert_one_dict_mgdb(
        data,
        coll_rt_agg_min_1,
        )
    print(result)
            

    return list_agg_min_1



def insert_agg_min_1(data, coll):
    coll.insert_one(data)
    pass
    
def start_agg_min_1(symbol):
    try:
        while True:
            time.sleep(1)    
            
            print('\n')
            try:
                agg_sec_5_to_min_1(symbol, coll_sec_5)
            except Exception as e:
                print(f"Error occurred: {e}")
    except KeyboardInterrupt:
        print("Interrupted! Exiting...")
        close_mgdb_client(db_client)
        
    
if __name__ == '__main__':
    time_now = current_datetime_utc()
    time_start = time_now.replace(second=0, microsecond=0)
    get_agg_min_1_many("QQQ", 3, )
    pass