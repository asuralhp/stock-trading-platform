import csv
import os
from GLOBAL import GLOFUNC
from ibapi.client import EClient
from ibapi.wrapper import EWrapper
from datetime import datetime

from datetime import datetime, timezone

from . import GLOVAR

def current_time_ISO8601():
    return datetime.now(timezone.utc).isoformat()

def dt_to_timestamp(dt):
    return int(dt.timestamp())

def current_datetime_utc():
    dt = datetime.now(timezone.utc)
    return dt

def utc_to_datetime(timestamp):
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    
    print(f"Converted {timestamp} to {dt}")
    
    return dt

def remove_file(file_path):
    try:
        os.remove(file_path)
        print(f"{file_path} has been removed.")
    except FileNotFoundError:
        print(f"{file_path} does not exist.")
    except Exception as e:
        print(f"Error occurred: {e}")

def csv_append_row(path_output, data):
    with open(path_output, mode='a', newline='') as file :
        writer = csv.writer(file)
        writer.writerow(data)
    
def create_folder_if_nonexist(path_folder):
    """Create a folder if it does not exist."""
    if not os.path.exists(path_folder):
        os.makedirs(path_folder)
        print(f"Folder '{path_folder}' created.")
    else:
        print(f"Folder '{path_folder}' already exists.")
        
    

    

def init_app(app, host='127.0.0.1', port=7497, clientId=0):
    app.connect(host, port, clientId)
    return app

def init_project(list_path_folder):
    for path in list_path_folder:
        create_folder_if_nonexist(path)
        
        
init_project(GLOVAR.LIST_PATH_FOLDER)

if __name__ == '__main__':
    # data = [1,2,'qqq',2,5,'a']
    # path_output = os.path.join(GLOVAR.PATH_DATA_OUTPUT,'test.csv')
    # csv_append_row(path_output, data)
    
    # print(current_time_ISO8601().split('T')[0])
    
    sample = datetime(2025, 8, 21, 16, 14)
    result = dt_to_timestamp(sample)
    print(result)