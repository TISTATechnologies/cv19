#!/usr/bin/env python3
# #############################################################################
# - Pull information from the JHU Covid-19 Dataset
# - * https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports
# - Requirements: requests, psycopg2
#
# Note:
#   JHU has dataset starting from 2020-01-22
#   But CSV files before 2020-03-23 have a different format
# #############################################################################
# pylint: disable=R0801
import datetime
from decimal import Decimal

from ..utils import logger
from ..utils.helper import Converter, CsvHelper, DatabaseContext
from .base import Collector

log = logger.get_logger(__file__)


# pylint: disable=too-many-locals, too-many-statements
class JHUCollector(Collector):
    MIN_STATE_DATE = datetime.datetime(2020, 4, 12).date()

    def __init__(self):
        super().__init__(1)
        self.name = 'jhu'
        self.csv_helper = CsvHelper()

    def _get_row_val(self, row, idx, default=None):
        return row[idx] if len(row or []) > idx else default

    def _get_row_val_int(self, row, idx, default=None):
        val = self._get_row_val(row, idx, default)
        return int(float(val)) if val else default

    def _read_jhu_dataline(self, url):
        idx = -1
        for row in self.csv_helper.read_url(url, overwrite=True):
            if '404: Not Found' in row:
                log.error(f'ERROR: {row}')
                break
            if 'Country_Region' in row and 'Province_State' in row:     # Skip CSV file header
                continue
            if 'Unassigned' in row:                         # Skip "Unassigned" counties
                continue
            idx += 1
            yield (idx, row)

    # pylint: disable=unused-argument, useless-return
    def _parse_county_row_v1(self, day, row, db):                               # before 2020-03-23
        # Row header:
        # Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered
        log.warning(f'Parser V1: not implemented:')
        return None

    def _parse_county_row_v2(self, day, row, db):                               # after/on 2020-03-23
        # Row header:
        # FIPS,_,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key
        row_len = len(row)
        fips_raw = self._get_row_val(row, 0)                                    # FIPS
        fips = fips_raw.rjust(5, '0') if fips_raw else None
        country_name = self._get_row_val(row, 3)                                # Country_Region
        country_id = db.references.find_country_id(country_name)
        state_name = self._get_row_val(row, 2)                                  # Province_State
        state_id = db.references.find_state_id(country_id, state_name)
        last_update = Converter.parse_datetime(row[4]) if row_len > 4 else None # Last_Update
        geo_lat = Decimal(row[5] if row_len > 5 and row[5] else 0)              # Lat
        geo_long = Decimal(row[6] if row_len > 6 and row[6] else 0)             # Long_
        confirmed = self._get_row_val_int(row, 7, 0)                            # Confirmed
        deaths = self._get_row_val_int(row, 8, 0)                               # Deaths
        recovered = self._get_row_val_int(row, 9, 0)                            # Recovered
        active = self._get_row_val_int(row, 10, 0)                              # Active
        source_location = self._get_row_val(row, 11)                            # Combined_Key
        unique_key = self.get_unique_key([country_id, state_id, fips, last_update])
        collected_time = datetime.datetime(day.year, day.month, day.day, 23, 59, 59)
        return (country_name, country_id, state_name, state_id, fips,
                last_update, geo_lat, geo_long, source_location, unique_key,
                confirmed, deaths, recovered, active, collected_time)

    def _parse_state_row(self, day, row, db):
        # Row header:
        # Province_State,Country_Region,Last_Update,Lat,Long_, Confirmed,Deaths,Recovered,Active, FIPS,
        # Incident_Rate,People_Tested,People_Hospitalized, Mortality_Rate,UID,ISO3,Testing_Rate,Hospitalization_Rate
        row_len = len(row)
        country_id = 'US'
        country_name = db.references.countries[country_id]
        state_name = self._get_row_val(row, 0)                                  # Province_State
        state_id = db.references.find_state_id(country_id, state_name)
        last_update = Converter.parse_datetime(row[2]) if row_len > 2 else None # Last_Update
        geo_lat = Decimal(row[3] if row_len > 3 and row[3] else 0)              # Lat
        geo_long = Decimal(row[4] if row_len > 4 and row[4] else 0)             # Long_
        confirmed = self._get_row_val_int(row, 5, 0)                            # Confirmed
        deaths = self._get_row_val_int(row, 6, 0)                               # Deaths
        recovered = self._get_row_val_int(row, 7, 0)                            # Recovered
        active = self._get_row_val_int(row, 12, 0)                              # People_Hospitalized
        fips = row[9].rjust(5, '0') if row_len > 9 else None                    # FIPS
        source_location = f'{state_name},{country_id}'
        unique_key = self.get_unique_key([country_id, state_id, fips, last_update])
        collected_time = datetime.datetime(day.year, day.month, day.day, 23, 59, 59)
        return (country_name, country_id, state_name, state_id, fips,
                last_update, geo_lat, geo_long, source_location, unique_key,
                confirmed, deaths, recovered, active, collected_time)

    def _pull_county_data_by_day(self, day):
        log.info(f'Start pull county information - day={day}')
        url = ''.join([f'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/',
                       f'csse_covid_19_data/csse_covid_19_daily_reports/{day.strftime("%m-%d-%Y")}.csv'])
        if day >= datetime.datetime(2020, 3, 22).date():
            parse_data_func = self._parse_county_row_v2
        else:
            parse_data_func = self._parse_county_row_v1
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            idx = 0
            for row_idx, row in self._read_jhu_dataline(url):
                idx = row_idx
                log.debug(f'Parse row [{idx:5}]: {row}')
                (_, country_id, _, state_id, fips,
                 last_update, geo_lat, geo_long, source_location, unique_key,
                 confirmed, deaths, recovered, active, collected_time
                ) = parse_data_func(day, row, db)
                self.save_covid_data_item(db, idx, country_id, state_id, fips,
                                          confirmed, deaths, recovered, active,
                                          geo_lat, geo_long, source_location, last_update,
                                          unique_key, collected_time)
            self.end_pulling(db, day, idx)
        log.info(f'End pull county information - day={day}')
        return True

    def _pull_state_data_by_day(self, day):
        log.info(f'Start pull state information - day={day}')
        url = ''.join([f'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/',
                       f'csse_covid_19_data/csse_covid_19_daily_reports_us/{day.strftime("%m-%d-%Y")}.csv'])
        if day < JHUCollector.MIN_STATE_DATE:
            log.warning(f'The JHU dataset doesn\t have state date before {JHUCollector.MIN_STATE_DATE}')
            return False

        with DatabaseContext() as db:
            self.start_pulling(db, day)
            idx = 0
            for row_idx, row in self._read_jhu_dataline(url):
                idx = row_idx
                log.debug(f'Parse row [{idx:5}]: {row}')
                (_, country_id, _, state_id, fips,
                 last_update, geo_lat, geo_long, source_location, unique_key,
                 confirmed, deaths, recovered, active, collected_time
                ) = self._parse_state_row(day, row, db)
                self.save_covid_data_item(db, idx, country_id, state_id, fips,
                                          confirmed, deaths, recovered, active,
                                          geo_lat, geo_long, source_location, last_update,
                                          unique_key, collected_time)
            self.end_pulling(db, day, idx - 1)
        log.info(f'End pull state information - day={day}')
        return True

    def pull_data_by_day(self, day):
        self._pull_state_data_by_day(day)
        self._pull_county_data_by_day(day)


# pylint: disable=unused-argument
def run(day, args=None):
    JHUCollector().run(day)
    return True
