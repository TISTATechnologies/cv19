#!/usr/bin/env python3
# #############################################################################
# - Pull information from the JHU Covid-19 Dataset
# - * https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports
# --
# - Usage: pull-data-from-jhu.py [date|all]
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
import hashlib
import inspect
import sys
from os import path
from decimal import Decimal

# Add parent directory to the import search paths
sys.path.insert(0, path.dirname(path.dirname(path.abspath(inspect.getfile(inspect.currentframe())))))
import lib.logger as logger
from lib.helper import Converter, CsvHelper, DatabaseContext


def show_help():
    print(''.join([l[4:] for l in open(__file__, 'r').readlines() if l.startswith('# -')]))


def parse_row_v1(row, db):
    # --- format before 2020-03-23 ------------------------
    # Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered
    # "Los Angeles, CA",US,2020-02-01T19:53:03,1,0,0
    # "San Benito, CA",US,2020-02-03T03:53:02,2,0,0
    # Hubei,Mainland China,2020-02-26T14:13:10,65187,2615,20969
    log.warn(f'Parser V1: not implemented')
    return None


def parse_row_v2(row, db):
    # --- format before 2020-03-23 (implemented) ----------
    # FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key
    # 45001,Abbeville,South Carolina,US,2020-04-02 23:25:27,34.22333378,-82.46170658,6,0,0,0,"Abbeville, South Carolina, US"
    if 'Country_Region' in row and 'Province_State' in row:     # Skip CSV file header
        return None
    row_len = len(row)
    fips_raw = row[0] if row_len > 0 else None
    fips = row[0].rjust(5, '0') if fips_raw else None
    country_name = row[3] if row_len > 3 else None
    country_id = db.references.find_country_id(country_name)
    state_name = row[2] if row_len > 2 else None
    state_id = db.references.find_state_id(country_id, state_name)
    last_update = Converter.parse_datetime(row[4]) if row_len > 4 else None
    geo_lat = Decimal(row[5] if row_len > 5 and row[5] else 0)
    geo_long = Decimal(row[6] if row_len > 6 and row[6] else 0)
    confirmed = int(row[7] if row_len > 7 else 0)
    deaths = int(row[8] if row_len > 8 else 0)
    recovered = int(row[9] if row_len > 9 else 0)
    active = int(row[10] if row_len > 10 else 0)
    source_location = row[11] if row_len > 11 else None
    unique_key = f'{SOURCE_ID:04o}' + hashlib.md5(f'{country_id}{state_id}{fips}{last_update}'.encode()).hexdigest()
    return (country_name, country_id, state_name, state_id, fips,
            last_update, geo_lat, geo_long, source_location, unique_key,
            confirmed, deaths, recovered, active)


def pull_data_by_day(day):
    log.info(f'Start pull information - day={day}')
    url = ''.join([f'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/',
                   f'csse_covid_19_data/csse_covid_19_daily_reports/{day.strftime("%m-%d-%Y")}.csv'])
    idx = -1
    counter_items_added = 0
    counter_items_country_not_found = []
    counter_items_duplicate = 0
    file_format_v2 = day >= datetime.datetime(2020, 3, 22).date()
    with DatabaseContext() as db:
        db.log_message(f'{script_name}: Start pull information - day={day}')
        db.references.load_all()
        for row in csv_helper.read_url(url, overwrite=False):
            idx += 1
            country_name = None
            try:
                log.debug(f'Parse row [{idx:5}]: {row} (format={"v2" if file_format_v2 else "v1"})')
                if '404: Not Found' in row:
                    log.error(f'ERROR: {row}')
                    break
                values = parse_row_v2(row, db) if file_format_v2 else parse_row_v1(row, db)
                if not values:
                    log.debug(f'Skip row: {row}')
                    continue
                (country_name, country_id, state_name, state_id, fips,
                 last_update, geo_lat, geo_long, source_location, unique_key,
                 confirmed, deaths, recovered, active
                 ) = values
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
                elif 'column "country_id" violates not-null constraint' in err_message:
                    counter_items_country_not_found.append(country_name)
                    db.rollback()
                    log.warn(err_message)
                else:
                    raise ex
        message = (f'Processed {idx - 1} items - day={day}: added={counter_items_added}, '
                   f'duplicate={counter_items_duplicate}, country-not-found={len(counter_items_country_not_found)}')
        log.info(message)
        db.log_message(f'{script_name}: {message}')
        if counter_items_country_not_found:
            log.warn(f'Not-Found countrues: {counter_items_country_not_found}')
    return True


script_name = path.splitext(path.basename(sys.argv[0]))[0]
log = logger.getLogger(script_name)
SOURCE_ID = 1                               # covid_data_source = JHU
csv_helper = CsvHelper()


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
