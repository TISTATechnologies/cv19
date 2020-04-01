#!/usr/bin/env python3
# =============================================================================
# The script will prepearing "data-us-zip2fipz.csv file.
# 1. Download excel file with US Zips to FIPS mapping from the huduser.gov.
# 2. Convert it into the suitable CSV: zip,fips,name,country_id,state_id
# =============================================================================
import os
import sys
from pathlib import Path

root_dir = Path(__file__).parent / ('../' * 4)
services_path = (root_dir / 'services').resolve()
sys.path.insert(0, str(services_path))
from lib.helper import CsvHelper, ExcelHelper, trace

resut_file = root_dir / 'data' / 'covid-database' / 'init' / 'data-us-zip2fips.csv'
csv_helper = CsvHelper()
excel_helper = ExcelHelper()

counties = {}
state_file = root_dir / 'data' / 'covid-database' / 'init' / 'data-us-regions.csv'
for values in csv_helper.read_csv_file(state_file):
    counties[values[2]] = {
        "name": values[3],
        "country_id": values[0],
        "state_id": values[1],
    }

URL = 'https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_032020.xlsx'
trace(f'Download data from: {URL}')
with resut_file.open('w') as fo:
    fo.write('zip,fips,name,country_id,state_id\n')
    for row in excel_helper.read_table_from_url(URL, columns='A,B'):
        zip = f'{row[0]:05}'
        fips = f'{row[1]:05}'
        region = counties.get(fips)
        if not region:
            trace(f'Error: fips {fips} not found. zip={zip}')
        else:
            name = region['name']
            country_id = region['country_id']
            state_id = region['state_id']
            res_line = f'{zip},{fips},{name},{country_id},{state_id}'
            print(res_line)
            fo.write(res_line)
            fo.write('\n')
trace(f'Result file is {resut_file}')
