from GLOBAL import GLOVAR
from GLOBAL.MGDBFUNC import init_mgdb_client, init_mgdb_db
from GLOBAL.GLOFUNC import utc_to_datetime


db_client = init_mgdb_client(GLOVAR.URL_MGDB)
db = init_mgdb_db(db_client, GLOVAR.MGDB_MARKET_DATA)
coll_ss_min_1 = db[GLOVAR.MGDB_COLL_SS_MIN_1]


def get_list_ss_min_1(symbol, limit=5):
    result = list(coll_ss_min_1.find({'symbol': symbol}).sort([('$natural', -1)]).limit(limit))
    return result


if __name__ == "__main__":
    # result = get_list_ss_min_1('NVDA', 3)
    # print(result)
    dd = utc_to_datetime(1757076160)
    print(dd)