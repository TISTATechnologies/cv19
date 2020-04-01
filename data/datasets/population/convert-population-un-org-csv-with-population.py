#!/usr/bin/env python3
import sys
from pathlib import Path

root_dir = Path(__file__).parent / '..' / '..' / '..'
sys.path.insert(0, str((root_dir / 'services').resolve()))
from lib.helper import CsvHelper, trace


csv_helper = CsvHelper()
countries_file = root_dir / 'data' / 'covid-database' / 'init' / 'data-countries.csv'
# list((country_id, country_name, country_aliases))
countries = [(r[0], r[1].lower(), (r[2] or '').lower().split(',')) for r in csv_helper.read_csv_file(countries_file)]

for row in csv_helper.read_stdin():
    if 'PopTotal' in row and 'Location' in row:
        continue                            # skip header
    country_name = row[1].lower()
    country_id = None
    for c in countries:
        if c[1] == country_name or country_name in c[2]:
            country_id = c[0]
            break
    if country_id is None:
        trace(f'Skip country: {country_name}')
    else:
        population = int(float(row[8]) * 1000)
        fips = '00000' if country_id == 'US' else ''
        print(f'{country_id},,{fips},{population}')
