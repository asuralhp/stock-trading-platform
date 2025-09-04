import os
import threading
import GLOFUNC
import GLOBAL.GLOVAR as GLOVAR
from ibapi.client import *
from ibapi.wrapper import *
import datetime
import time


port = 7496


class SnapshotApp(EClient, EWrapper):
    def __init__(self):
        EClient.__init__(self, self)

    def setReqInfo(self, prefix, date, time):
        self.date = date
        self.time = time
        date_formatted = f"{self.date[:4]}-{self.date[4:6]}-{self.date[6:]}"
        self.path_name = prefix + date_formatted + '.csv'
        self.path_output = os.path.join(GLOVAR.PATH_DATA_OUTPUT, self.path_name)
        print(f"Path of data output: {self.path_output}")
    
    def initFile(self):
        GLOFUNC.remove_file(self.path_output)
        GLOFUNC.csv_append_row(self.path_output, ['ReqId', 'Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'WAP', 'BarCount'])
    
    
    def nextValidId(self, orderId):
        self.orderId = orderId
    
    def nextId(self):
        self.orderId += 1
        return self.orderId
    
    def error(self, reqId, errorCode, errorString, advancedOrderReject=""):
        print(f"reqId: {reqId}, errorCode: {errorCode}, errorString: {errorString}, orderReject: {advancedOrderReject}")
    
    def historicalData(self, reqId, bar):
        print(reqId, bar)
        data = [reqId, bar.date, bar.open, bar.high, bar.low, bar.close, bar.volume, bar.wap, bar.barCount]
        GLOFUNC.csv_append_row(self.path_output, data)
      
    
    def historicalDataEnd(self, reqId, start, end):
        print(f"Historical Data Ended for reqId {reqId}. Started at {start}, ending at {end}")
        self.cancelHistoricalData(reqId)
        app.disconnect()

app = SnapshotApp()

app.connect(GLOVAR.IP_LOCAL, GLOVAR.PORT_LIVE, GLOVAR.CLIENT_ID_MIN_1)
threading.Thread(target=app.run).start()
time.sleep(3)

mycontract = Contract()
mycontract.symbol = "QQQ"
mycontract.secType = "STK"
mycontract.exchange = "SMART"
mycontract.currency = "USD"

app.setReqInfo(
    prefix='min-1-snapshot-',
    date='20250815', 
    time='16:00:00'
    )
app.initFile()

app.reqHistoricalData(app.nextId(), mycontract, f"{app.date} {app.time} US/Eastern", "1 D", "1 min", "TRADES", 0, 1, False, [])