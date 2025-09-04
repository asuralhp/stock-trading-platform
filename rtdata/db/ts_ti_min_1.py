from datetime import timedelta
import time
from GLOBAL import GLOVAR
from GLOBAL.GLOFUNC import current_datetime_utc
from GLOBAL.MGDBFUNC import close_mgdb_client, delete_by_id, find_one_ts_mgdb, find_gte_lte_ts_mgdb, init_coll, init_mgdb_client, init_mgdb_db, insert_one_dict_mgdb, replace_by_id
from GLOBAL.QUANTFUNC import ti_rsi

db_client = init_mgdb_client(GLOVAR.URL_MGDB)
db = init_mgdb_db(db_client, GLOVAR.MGDB_REALTIME_DATA)
coll_rt_agg_min_1 = db[GLOVAR.MGDB_COLL_RT_AGG_MIN_1]
coll_rt_ti = init_coll(db, GLOVAR.MGDB_COLL_RT_TI, 'minutes', isRecreate=GLOVAR.ISRECREATE_MGDB_COLL_RT_TI)



def ts_ti_min_1(symbol, coll_rt_ti, coll_rt_agg_min, period):
    time_now = current_datetime_utc()
    print(f'current :{time_now}')
    time_end = time_now.replace(second=0, microsecond=0)
    time_start = time_end - timedelta(minutes=period)

    print(f'start :{time_start}, end :{time_end}')
    list_min_1 = find_gte_lte_ts_mgdb(symbol, time_start, time_end, coll_rt_agg_min)

    if len(list_min_1) < period + 1:
        print(f"--- Got {len(list_min_1)} Data, less than {period + 1}, Start Pre ---")
        time_end    = time_end - timedelta(minutes=1)
        time_start  = time_start - timedelta(minutes=1)
        
        list_min_1 = find_gte_lte_ts_mgdb(symbol, time_start, time_end, coll_rt_agg_min)
    
    if list_min_1 is None or len(list_min_1) < period + 1:
        print(f"--- Not enough data to calculate. Need {period + 1}, got {len(list_min_1) if list_min_1 else 0} ---")
        return None
    list_close = []
    for min_1 in list_min_1:
        list_close.append(min_1['close'])
    print(list_close)
    rsi = ti_rsi(list_close, period)
    data = {
        "symbol": symbol,
        "time": time_end,
        "rsi": rsi
    }

    result = replace_by_id(symbol, data, time_end, coll_rt_ti)

    print(f"RSI: {rsi}")

    
    return result
    


def start_ti_loop(symbol):
    try:
        while True:
            time.sleep(.5)    

            print('\n')
            result = ts_ti_min_1(symbol, coll_rt_ti, coll_rt_agg_min_1, 7)

    except KeyboardInterrupt:
        print("Interrupted! Exiting...")
        close_mgdb_client(db_client)
    

if __name__ == "__main__":
    # webhook("QQQ")
    start_ti_loop("QQQ")