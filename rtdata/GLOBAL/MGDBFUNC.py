from datetime import datetime, timedelta
import random
from GLOBAL import GLOVAR
from pymongo import MongoClient, ASCENDING



def init_mgdb_client(url_db):
    client = MongoClient(url_db)     
    
    return client

def init_mgdb_db(client, name_db):
    db = client[name_db]
    return db

def close_mgdb_client(client):
    client.close()



def init_coll(db, name_coll, granularity, isRecreate=False):
    if isRecreate:
        db[name_coll].drop()
        
    try :
        coll = db.create_collection(name_coll, timeseries={
            "timeField": "time",
            "metaField": "symbol",
            "granularity": granularity
        })
    except:
        pass
    finally:
        coll = db[name_coll]
    return coll


def find_one_ts_mgdb(symbol, time_start, coll):
    
    result = list(coll.find({'symbol': symbol, 'time': time_start}))
    
    return result


def find_gte_lte_ts_mgdb(symbol, time_start, time_end, coll):

    result = list(coll.find({'symbol': symbol, 'time': {'$gte': time_start, '$lte': time_end}}))

    return result


def insert_one_dict_mgdb(data, coll):
    
    result = coll.insert_one(data)
    

    return result


def update_dict_mgdb(filter, update, coll, many=False, upsert=False):
    if many != True:
        result = coll.update_one(filter, update, upsert)
    else :
        result = coll.update_many(filter, update, upsert)
    
    return result


def delete_by_id(id, coll):
    result = coll.delete_one(
        {"_id": id}
    )
    print(f"Deleted {result}.")
    return result

def replace_by_id(symbol, data, timeslot, coll ):
    
    print("Data : ",data)
    last_ti = find_one_ts_mgdb(symbol, timeslot, coll)
    if len(last_ti) <= 0:
        print(f"--- Inserting New Data for {timeslot} ---")
        
    else:
        print(f"--- Found Data for {timeslot} ---")
        print(last_ti[0])
        delete_by_id(last_ti[0]['_id'], coll)
    
        
    result = insert_one_dict_mgdb(data, coll)
    
    return result

if __name__ == "__main__":
    url_db  = GLOVAR.URL_MGDB
    name_db = GLOVAR.MGDB_REALTIME_DATA
    coll = GLOVAR.MGDB_COLL_RT_SEC_5

    # client.drop_database(name_db)
    client = init_mgdb_client(url_db)
    db = init_mgdb_db(client, name_db)

    db[coll].drop()
    coll_sec_5 = db.create_collection(coll, timeseries={
        "timeField": "time",
        "metaField": "symbol",
        "granularity": "seconds"
        })
    
    data = []
    for i in range(300):
        data.append(
        {
            "symbol":"QQQ",
            "tickerid": 2,
            "time": datetime.now() + timedelta(seconds=5 * i) ,
            "endtime": -1,
            "open": 578.07,
            "high": 578.15 ,
            "low": 578.05,
            "close": 578.15 + 10 * random.random(),
            "volume": 3949,
            "wap": 578.1067485439353,
            "count": 39
        }
        )
    
    # coll_sec_5.insert_many(data)
    
    
    
    close_mgdb_client(client)