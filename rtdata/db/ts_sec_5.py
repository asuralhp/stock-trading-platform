
from datetime import datetime
from GLOBAL import GLOVAR
from GLOBAL.MGDBFUNC import close_mgdb_client, init_coll, init_mgdb_client, init_mgdb_db

db_client = init_mgdb_client(GLOVAR.URL_MGDB)
db = init_mgdb_db(db_client, GLOVAR.MGDB_REALTIME_DATA)
coll_sec_5 = init_coll(db, GLOVAR.MGDB_COLL_RT_SEC_5, 'seconds', isRecreate=GLOVAR.ISRECREATE_COLL_RT_SEC_5)





# def rt_agg_sec_5_to_1_min(db_client, coll_sec_5):
    
    

if __name__ == "__main__":

    # agg_sec_5_to_1_min(db_client, coll_sec_5)

    # data = []
    # for i in range(300):
    #     data.append(
    #     {
    #         "symbol":"QQQ",
    #         "tickerid": 2,
    #         "time": datetime.now() + timedelta(seconds=5 * i) ,
    #         "endtime": -1,
    #         "open": 578.07,
    #         "high": 578.15 ,
    #         "low": 578.05,
    #         "close": 578.15 + 10 * random.random(),
    #         "volume": 3949,
    #         "wap": 578.1067485439353,
    #         "count": 39
    #     }
    #     )
    
    # coll_sec_5.insert_many(data)
    
    
    pass