#!/usr/bin/env python3
import csv
import os
import sys
from pathlib import Path


root_dir = Path(__file__).parent / '..' / '..' / '..'
sys.path.insert(0, str((root_dir / 'services').resolve()))
from lib.helper import CsvHelper, trace

source_file = sys.argv[1]
csv_helper = CsvHelper()

state_fips = {}             # dict(name, fips)
state_ids = {}            # dict(name, state_id)
state_file = root_dir / 'data' / 'covid-database' / 'init' / 'data-us-states.csv'
for values in csv_helper.read_csv_file(state_file):
    state_fips[values[2].lower()] = values[5]
    state_ids[values[2].lower()] = values[0]
trace(f'Loaded {len(state_fips)} state fips')
trace(f'Loaded {len(state_ids)} state ids')

county_fips = {}            # dict(state_id, dict(county_name, fips))
counties_file = root_dir / 'data' / 'covid-database' / 'init' / 'data-us-regions.csv'
for values in csv_helper.read_csv_file(counties_file):
    if values[1] not in county_fips:
        county_fips[values[1]] = {}
    county_fips[values[1]][values[3].replace('\'', '').lower()] = values[2]
trace(f'Loaded {len(county_fips)} county fips')

trace(f'Read source file: {source_file}')
with open(source_file, encoding='utf-8', errors='backslashreplace') as fo:
    print(f'country_id,state_id,fips,population')
    for row in fo.readlines():
        try:
            values = [v.strip() for v in row.split(',')]
            if values[0] == 'STNAME':
                continue                # skip heder
            trace(f'Processing: {values}')
            fips_up = values[0].lower()
            fips_low = values[1].lower()
            if fips_low != '000':
                fips = f'{fips_up}{fips_low}'
            else:
                fips = f'{fips_low}{fips_up}'
            state_name = values[2].lower()
            county_name = values[3].replace('\'', '').lower()
            population = int(values[4])
            state_id = state_ids[state_name]
            trace(f'State={state_name}({state_id}), Fips={fips}, County={county_name}, Population={population}')
            if not fips:
                if state_name == county_name:
                    fips = state_fips[state_name]
                else:
                    fips = county_fips[state_id][county_name]
            if not state_id:
                trace(f'Error: cant find state_id: ${row}')
            elif not fips:
                trace(f'Error: cant find fips: ${row}')
            else:
                print(f'US,{state_id},{fips.rjust(5, "0")},{population}')
        except Exception as ex:
            trace(f'Error processing row: {row}')
            trace(f'Exception: {ex}')
