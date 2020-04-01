#!/usr/bin/env python3
import os
import sys
from pathlib import Path


def trace(message):
    sys.stderr.write(f'{message}{os.linesep}')


cur_dir = Path(__file__).parent
state_file = cur_dir / '..' / '..' / '..' / 'covid-database' / 'init' / 'data-us-states.csv'

trace(f'Read state files: {state_file}')
states = dict([(v[0], v[5]) for v in [i.split(',') for i in state_file.open(mode='r').readlines()]])

zip2fips = {}
mask = 'zipcty'
trace(f'Look all "{mask}"" files in the "{cur_dir}" directory')
idx = 0
trace(f'zip,fips,name,country_id,state_id')
for f in cur_dir.iterdir():
    if not f.is_file()or not f.name.startswith(mask) or '.' in f.name:
        # incorrect path
        continue
    trace(f'Processing "{f}" file')
    with f.open(mode='r') as fo:
        prev_line = None
        for line in fo.readlines():
            if len(line) <= 28:
                continue
            # print(f'Parse: {line}')
            zip = line[0:5].strip()
            update_key_no = line[5:15].strip()
            zip_low_no = line[15:19].strip()
            zip_high_no = line[19:23].strip()
            state_id = line[23:25].strip()
            if not state_id or not zip:
                continue
            state_fips = states.get(state_id)
            county_fips = line[25:28].strip()
            county_name = line[28:].strip().replace('\'', '\'\'')
            if ' ' in county_name or len(county_name) == 0:
                county_name = '"{0}"'.format(county_name)
            res_line = f'{zip},{state_fips}{county_fips},{county_name},US,{state_id}'
            idx += 1
            if prev_line == res_line:
                continue                # skip duplicates
            print(res_line)
            prev_line = res_line
