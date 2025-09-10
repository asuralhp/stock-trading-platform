import os
import threading

import GLOBAL.GLOVAR as GLOVAR
from GLOBAL.GLOFUNC import strdt_to_dt, remove_file, csv_append_row
from GLOBAL.MGDBFUNC import insert_one_dict_mgdb
from GLOBAL.QUANTFUNC import ohlc_ss_template
from ibapi.client import *
from ibapi.wrapper import *
import datetime
import time

from db.ts_ss_min_1 import coll_ss_min_1




class SnapshotApp(EClient, EWrapper):
    def __init__(self):
        EClient.__init__(self, self)
        self.reqId_to_contract = {}
    def setReqInfo(self, prefix, date, time):
        self.date = date
        self.time = time
        date_formatted = f"{self.date[:4]}-{self.date[4:6]}-{self.date[6:]}"
        self.path_name = prefix + date_formatted + '.csv'
        self.path_output = os.path.join(GLOVAR.PATH_DATA_OUTPUT, self.path_name)
        print(f"Path of data output: {self.path_output}")
    
    def initFile(self):
        remove_file(self.path_output)
        csv_append_row(self.path_output, ['ReqId', 'Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'WAP', 'BarCount'])
    
    
    def nextValidId(self, orderId):
        self.orderId = orderId
    
    def nextId(self):
        self.orderId += 1
        return self.orderId
    
    def error(self, reqId, errorCode, errorString, advancedOrderReject=""):
        print(f"reqId: {reqId}, errorCode: {errorCode}, errorString: {errorString}, orderReject: {advancedOrderReject}")
    
    def historicalData(self, reqId, bar):
        contract = self.reqId_to_contract[reqId]
        symbol = contract.symbol
        print(symbol, reqId, bar)
        data = ohlc_ss_template(
            symbol=symbol,
            date=strdt_to_dt(bar.date),
            open_=bar.open,
            high=bar.high,
            low=bar.low,
            close=bar.close,
            volume=bar.volume,
            wap=bar.wap,
            barcount=bar.barCount
        )
    
        insert_one_dict_mgdb(data, coll_ss_min_1)
        # GLOFUNC.csv_append_row(self.path_output, data)
      
    
    def historicalDataEnd(self, reqId, start, end):
        print(f"Historical Data Ended for reqId {reqId}. Started at {start}, ending at {end}")
        self.cancelHistoricalData(reqId)
        app.disconnect()

app = SnapshotApp()

app.connect(GLOVAR.IP_LOCAL, GLOVAR.PORT_LIVE, GLOVAR.CLIENT_ID_MIN_1)
threading.Thread(target=app.run).start()
time.sleep(3)

contract = Contract()
contract.symbol = "QQQ"
contract.secType = "STK"
contract.exchange = "SMART"
contract.currency = "USD"
reqId = app.nextId()
app.setReqInfo(
    prefix='min-1-snapshot-',
    date='20250815', 
    time='16:00:00'
    )
app.initFile()
app.reqId_to_contract[reqId] = contract
app.reqHistoricalData(reqId, contract, f"{app.date} {app.time} US/Eastern", "1 D", "1 min", "TRADES", 0, 1, False, [])