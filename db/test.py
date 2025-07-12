
import csv
import pandas as pd


csv_file_path = './data_raw/td_output.csv'  
 

with open(csv_file_path, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)   
    records = [row for row in reader]  
    
df = pd.DataFrame(records)
df.drop(columns=['tbd1', 'tbd2'], errors='ignore')  # Drop columns if they exist
df = df.iloc[:, :-1]

print(df)