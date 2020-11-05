#!/usr/bin/env python3
# #############################################################################
# Pull information from the Covid Tracking: https://covidtracking.com/api
# Requirements: requests, psycopg2
# #############################################################################
# pylint: disable=R0801
import datetime

from ..utils import logger
from ..utils.helper import Converter, DatabaseContext
from .base import Collector

log = logger.get_logger(__file__)


class CovidTrackingCollector(Collector):
    """ Service to collect Covid-19 data from the Covid Tracking
    Site: https://covidtracking.com/api
    """
    def __init__(self):
        super().__init__(2)
        self.name = 'covidtracking'

    def pull_data_by_day(self, day):
        filter_day = day.strftime("%Y%m%d")
        log.info(f'Start pull information - day={day}')
        states_url = f'http://covidtracking.com/api/v1/states/daily.json?date={filter_day}'
        us_url = f'http://covidtracking.com/api/v1/us/daily.json?date={filter_day}'
        idx = 0
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            state_items = self.load_json_data(states_url) or []
            us_items = self.load_json_data(us_url) or []
            state_items.extend(us_items)
            log.debug(f'Found {len(state_items)} items')

            for row in state_items:
                log.debug(f'Parse row [{idx:5}]: {row}')
                if str(row.get('date')) != filter_day:
                    continue                # skip old data
                idx += 1
                country_id = 'US'
                if 'states' in row and 'fips' not in row:
                    state_id = None
                    fips_number = 0
                else:
                    state_id = row['state']
                    fips_number = int(row["fips"])
                fips = f'{fips_number:05}'
                confirmed = int(float(row.get('positive') or 0))
                deaths = int(float(row.get('death') or 0))
                recovered = int(float(row.get('recovered') or 0))
                active = int(float(row.get('hospitalized') or 0))
                geo_lat = None
                geo_long = None
                source_location = None
                collected_time = datetime.datetime(day.year, day.month, day.day, 23, 59, 59)
                last_update_str = row.get('lastUpdateEt') or row.get('dateChecked')
                if 'T24:' in last_update_str:
                    last_update_str = last_update_str.replace('T24:', 'T00:')
                last_update = Converter.parse_datetime(last_update_str)
                unique_key = self.get_unique_key([country_id, state_id, fips, collected_time])
                self.save_covid_data_item(db, idx, country_id, state_id, fips,
                                          confirmed, deaths, recovered, active,
                                          geo_lat, geo_long, source_location, last_update,
                                          unique_key, collected_time)
            self.end_pulling(db, day, idx)
        return True


# pylint: disable=unused-argument
def run(day, args=None):
    CovidTrackingCollector().run(day)
    return True
