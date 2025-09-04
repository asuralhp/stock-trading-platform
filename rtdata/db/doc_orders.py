from GLOBAL import GLOVAR
from GLOBAL.MGDBFUNC import init_mgdb_client, init_mgdb_db, init_coll
from db.ts_sec_5 import coll_sec_5
from GLOBAL.MGDBFUNC import close_mgdb_client, insert_one_dict_mgdb
import time
db_client = init_mgdb_client(GLOVAR.URL_MGDB)
db = init_mgdb_db(db_client, GLOVAR.MGDB_ACCOUNT_DATA)
coll_doc_orders = db[GLOVAR.MGDB_COLL_ORDERS]
coll_doc_positions = db[GLOVAR.MGDB_COLL_POSITIONS]

def check_order(symbol, coll_orders, coll_price):
    results = []
    list_orders = list(coll_orders.find({'symbol': symbol, 'status': 'pending'}))
    last_tick = coll_price.find_one({'symbol': symbol}, sort=[('$natural', -1)])
    if len(list_orders):
        print("Found orders:", list_orders)
        for order in list_orders:
            limit = float(order['price'])
            quantity = int(order['amount'])
            price = float(last_tick['close'])
            userUid = order['userUid']
            action = order['action']
            if price < limit:
                if action == 'buy':
                    print(f"Order: {order['_id']} , limit : {limit} is above the last price: {price}.")
                    insert_one_dict_mgdb({
                        "userUid": userUid,
                        "symbol": symbol,
                        "cost": price,
                        "quantity": quantity
                    }, coll_doc_positions)
                    print(f"User: {userUid} {action} {quantity} of {symbol} at {price}.")
                    result =  coll_doc_orders.update_one(
                        {'_id': order['_id']},  
                        {'$set': {'status': 'completed'}}  
                    )

                    results.append(result)
    
            else:
                if action == 'sell':
                    #check position
                    position = coll_doc_positions.find_one({'symbol': symbol})
                    if position and position['quantity'] >= quantity:
                        print(f"Order: {order['_id']} , limit : {limit} is below the last price: {price}.")
                        new_quantity = position['quantity'] - quantity
                        if new_quantity == 0:
                            coll_doc_positions.delete_one({'_id': position['_id']})
                        else:
                            coll_doc_positions.update_one(
                                {'_id': position['_id']},  
                                {'$set': {'quantity': new_quantity}}  
                            )
                        print(f"User: {userUid} {action} {quantity} of {symbol} at {price}.")
                        result =  coll_doc_orders.update_one(
                            {'_id': order['_id']},  
                            {'$set': {'status': 'completed'}}  
                        )
                        
                        results.append(result)
                    else:
                        print(f"User: {userUid} has no enough position to {action} {quantity} of {symbol}.")
                        
    else:
        print(f"Symbol {symbol} pending orders not found.")
    if not len(results):
        print("No orders processed.")
    return results


def check_order_loop(list_symbols):
    try:
        while True:
            time.sleep(1)    

            print('\n')
            for symbol in list_symbols:
                result = check_order(symbol, coll_doc_orders, coll_sec_5)
                print(result)
    except KeyboardInterrupt:
        print("Interrupted! Exiting...")
        close_mgdb_client(db_client)
    
if __name__ == "__main__":
    check_order_loop(GLOVAR.LIST_SYMBOLS_ORDER_CHECK)