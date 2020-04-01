#!/usr/bin/env python3
# #############################################################################
# - Pull information from the Ccovid tracking api
# - * 
# --
# - Usage: pull-data-from-covidtracking.py [date|all]
# - Options:
# -   date    - date in the 'YYYY-MM-DD' format (default: Yesterday)
# -   all     - pull all data from each days in the in the JHU git repository
# --
# - Requirements: requests, psycopg2
#
# Note:
#   JHU has dataset starting from 2020-01-22
#   But CSV files before 2020-03-23 have a different format
# #############################################################################
import datetime
import json
import hashlib
import inspect
import sys
from os import path
from decimal import Decimal


# Add parent directory to the import search paths
sys.path.insert(0, path.dirname(path.dirname(path.abspath(inspect.getfile(inspect.currentframe())))))
import lib.logger as logger
from lib.helper import Converter, DatabaseContext, DownladHelper


def show_help():
    print(''.join([l[4:] for l in open(__file__, 'r').readlines() if l.startswith('# -')]))


def load_json_data(url):
    content = DownladHelper.read_content(url)
    log.debug(f'Convert content to json')
    parsed_data = json.loads(content)
    if 'error' in parsed_data and bool(parsed_data.get('error', False)):
        log.error(f'ERROR: {parsed_data}')
        return None
    return [parsed_data] if not isinstance(parsed_data, list) else parsed_data


def pull_data_by_day(day):
    log.info(f'Start pull information - day={day}')
    states_url = f'http://covidtracking.com/api/states/daily?date={day.strftime("%Y%m%d")}'
    us_url = f'http://covidtracking.com/api/us/daily?date={day.strftime("%Y%m%d")}'
    idx = -1
    counter_items_added = 0
    counter_items_duplicate = 0
    with DatabaseContext() as db:
        idx += 1
        db.log_message(f'{script_name}: Start pull information - day={day}')
        db.references.load_all()

        state_items = load_json_data(states_url) or []
        us_items = load_json_data(us_url) or []
        state_items.extend(us_items)
        log.debug(f'Found {len(state_items)} items')
        for row in state_items:
            try:
                idx += 1
                log.debug(f'Parse row [{idx:5}]: {row}')
                country_id = 'US'
                if 'states' in row and 'fips' not in row:
                    state_id = None
                    fips_number = 0
                else:
                    state_id = row['state']
                    fips_number = int(row["fips"])
                fips = f'{fips_number:05}'
                confirmed = int(row.get('positive') or 0)
                deaths = int(row.get('death') or 0)
                recovered = int(row.get('recovered') or 0)
                active = int(row.get('hospitalized') or 0)
                geo_lat = None
                geo_long = None
                source_location = None
                last_update = Converter.parse_datetime(row['dateChecked'])
                unique_key = f'{SOURCE_ID:04o}' + hashlib.md5(f'{country_id}{state_id}{fips}{last_update}'.encode()).hexdigest()
                sql = ''.join([
                    'covid_data ',
                    '(source_id, country_id, state_id, fips, confirmed, deaths, recovered, active, ',
                    'geo_lat, geo_long, source_location, source_updated, unique_key) ',
                    'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);'])
                values = (SOURCE_ID, country_id, state_id, fips,
                          confirmed, deaths, recovered, active,
                          geo_lat, geo_long, source_location, last_update, unique_key)
                res = db.insert(sql, values)
                log.info(f'Item={idx:05}: Success insert item into the database: {values}')
                db.commit()
                counter_items_added += 1
            except Exception as ex:
                err_message = str(ex)
                if 'covid_data_unique_key_key' in err_message:
                    counter_items_duplicate += 1
                    db.rollback()
                    log.warn(err_message)
                else:
                    raise ex
        message = (f'Processed {idx - 1} items - day={day}: added={counter_items_added}, '
                   f'duplicate={counter_items_duplicate}')
        log.info(message)
        db.log_message(f'{script_name}: {message}')
    return True


script_name = path.splitext(path.basename(sys.argv[0]))[0]
log = logger.getLogger(script_name)
SOURCE_ID = 2                               # covid_data_source = Covid Tracking Project


def main():
    arg1 = sys.argv[1] if len(sys.argv) > 1 else None
    if arg1 in ('help', '--help'):
        show_help()
        sys.exit(1)

    start_time = datetime.datetime.now()
    log.info(f'Start script {sys.argv[0]}')
    if arg1 in ('all', '--all'):
        start_day = datetime.datetime(2020, 3, 23)      # source has a different format before and after this day
        day = datetime.datetime.now()
        while day > start_day:
            pull_data_by_day(day.date())
            day -= datetime.timedelta(days=1)
    else:
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        day = Converter.parse_date(arg1) if arg1 else yesterday
        pull_data_by_day(day)
    log.info(f'Complete execution script {sys.argv[0]} (ducation = {datetime.datetime.now() - start_time})')


main()
