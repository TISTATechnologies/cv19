#!/usr/bin/env python3
# requirements: pandas, xlrd
import sys
import os
import pandas
file_name = sys.argv[1]
# print(f'Read file {file_name}')
data = pandas.read_excel(file_name, sheet_name=0, usecols='A,C')
start_data_rows = False
for (name, val) in [(str(r._1), str(r._2)) for r in data.itertuples()]:
    if name == 'nan' or val == 'nan':
        if start_data_rows:
            break
        else:
            continue
    start_data_rows = True
    name = name.strip('.').strip(' ')
    names = [n.strip(' ') for n in name.split(',')]
    if len(names) > 1:
        print(f'{names[1]},{names[0]},{val}')
    else:
        print(f'{names[0]},{names[0]},{val}')
