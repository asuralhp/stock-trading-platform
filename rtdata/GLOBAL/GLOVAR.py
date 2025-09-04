import os

PATH_CURRENT = os.path.join(os.path.abspath(__file__), "../..")
PATH_DATA = os.path.join(PATH_CURRENT,'data')

URL_MGDB = 'mongodb://localhost:27017/'
MGDB_REALTIME_DATA = 'realtime_data'
MGDB_ACCOUNT_DATA = 'account_data'
MGDB_COLL_RT_SEC_5 = 'coll_sec_5'
MGDB_COLL_RT_AGG_MIN_1 = 'coll_min_1'
MGDB_COLL_RT_TI = 'coll_ti_min_1'
MGDB_COLL_ORDERS = 'orders'
MGDB_COLL_POSITIONS = 'positions'
LIST_SYMBOLS_ORDER_CHECK = ['QQQ']

ISRECREATE_COLL_RT_SEC_5 = False
ISRECREATE_MGDB_COLL_RT_AGG_MIN_1 = False
ISRECREATE_MGDB_COLL_RT_TI = False

DB_MARKET_DATA = 'MARKET_DATA'
PATH_DATA_DATABASE = os.path.join(PATH_DATA,'db')
URL_MARKET_DATA = f"sqlite:///{PATH_DATA_DATABASE}/{DB_MARKET_DATA}.db"
URL_MARKET_DATA = URL_MARKET_DATA.replace('\\', '/')
IP_LOCAL = "127.0.0.1"
PORT_LIVE = 7496
PORT_PAPER = 7497

CLIENT_ID_SEC_5 = 0
CLIENT_ID_MIN_1 = 1

PATH_DATA_OUTPUT = os.path.join(PATH_DATA,'output')

LIST_PATH_FOLDER = [PATH_DATA, PATH_DATA_OUTPUT, PATH_DATA_DATABASE]

local_vars = locals().copy()
for k, v in local_vars.items():
    print(f'{k:20}: {v}')