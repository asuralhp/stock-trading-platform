import os
import threading
from GLOBAL import GLOVAR, GLOFUNC
from ibapi.client import *
from ibapi.wrapper import *
from ibapi.contract import Contract
import time

from GLOBAL.MGDBFUNC import close_mgdb_client
from db.ts_sec_5 import coll_sec_5, db_client
# from db.tb_sec_5 import Sec_5, craete_sec_5, session
from GLOBAL.GLOFUNC import utc_to_datetime

class RealTimeApp(EWrapper, EClient): 
    def __init__(self): 
        EClient.__init__(self, self)
        self.reqId_to_contract = {}
        
        # deprecated
        # current_time = GLOFUNC.current_time_ISO8601().split('T')[0]
        # self.path_name = 'sec-5-realtime-' + current_time + '.csv'
        # self.path_output = os.path.join(GLOVAR.PATH_DATA_OUTPUT, self.path_name)
        # if not os.path.isfile(self.path_output):
        #     GLOFUNC.csv_append_row(self.path_output, ['Symbol', 'ReqId', 'Time', 'Formattime', 'EndTime', 'Open', 'High', 'Low', 'Close', 'Volume', 'WAP', 'Count'])
    
    
    # def contractDetails(self, reqId, contractDetails):
    #     print(f"Contract ID: {reqId}")
    #     print(f"Symbol: {contractDetails.contract.symbol}")
    #     print(f"SecType: {contractDetails.contract.secType}")
    #     print(f"Exchange: {contractDetails.contract.exchange}")
    #     print(f"Currency: {contractDetails.contract.currency}")
        
    
    #     return contractDetails
    
    def disconnect(self):
        # Call the base class disconnect method
        super().disconnect()
        close_mgdb_client(db_client)
        # Perform any additional cleanup here
        print("Disconnecting and cleaning up resources...")
    
    
    def nextValidId(self, orderId: OrderId):
        self.orderId = orderId
    
    def nextId(self):
        self.orderId += 1
        return self.orderId
    def realtimeBar(self, reqId: TickerId, time:int, open_: float, high: float, low: float, close: float, volume: Decimal, wap: Decimal, count: int):
        contract = self.reqId_to_contract[reqId]
        symbol = contract.symbol
        formattime = utc_to_datetime(time)
        print(f"Symbol:{symbol}, Time:{formattime}, ReqId:{reqId}, ", RealTimeBar(time, -1, open_, high, low, close, volume, wap, count))
        
        
        data = {    
            "symbol":symbol,
            "tickerid": 2,
            "timestamp": time,
            "time": formattime,
            "endtime": -1,
            "open": open_,
            "high": high ,
            "low": low,
            "close": close,
            "volume": int(volume),
            "wap": float(wap),
            "count": count
        }
        
        coll_sec_5.insert_one(data)
        
        
        
        
        # deprecated
        # data = [
        #     symbol,
        #     reqId,
        #     time,
        #     formattime,
        #     -1,
        #     open_,
        #     high,
        #     low,
        #     close,
        #     volume,
        #     wap,
        #     count
        # ]
        # row = craete_sec_5(*data)
        # insert_db(session, row)
        # GLOFUNC.csv_append_row(self.path_output, data)
        

app = RealTimeApp() 
     
app.connect(GLOVAR.IP_LOCAL, GLOVAR.PORT_LIVE, GLOVAR.CLIENT_ID_SEC_5)
threading.Thread(target=app.run).start()
time.sleep(2)

contract = Contract() 
contract.symbol = "QQQ" 
contract.secType = "STK" 
contract.currency = "USD" 
contract.exchange = "SMART" 
reqId = app.nextId()
app.reqRealTimeBars(reqId, contract, 5, "TRADES", 0, [])
app.reqId_to_contract[reqId] = contract





# client.cancelRealTimeBars(3001);


# deprecated
# get_table(session, Sec_5)
# session.close()