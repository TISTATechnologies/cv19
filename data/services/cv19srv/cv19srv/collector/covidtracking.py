#!/usr/bin/env python3
# #############################################################################
# Pull information from the Covid Tracking: https://covidtracking.com/api
# Requirements: requests, psycopg2
# #############################################################################
# pylint: disable=R0801
from ..utils import logger
from ..utils.helper import Converter, DatabaseContext, DateTimeHelper
from .base import Collector, CovidDataItem, RawDataItem

log = logger.get_logger(__file__)


class CovidTrackingCollector(Collector):
    """ Service to collect Covid-19 data from the Covid Tracking
    Site: https://covidtracking.com/api
    """
    def __init__(self):
        super().__init__('covidtracking', 2)

    def pull_data_by_day(self, day):
        filter_day = day.strftime("%Y%m%d")
        log.info(f'Start pull information - day={day}')
        states_url = f'http://covidtracking.com/api/v1/states/daily.json'
        us_url = f'http://covidtracking.com/api/v1/us/daily.json'
        idx = 0
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            state_items = self.load_json_data(states_url) or []
            us_items = self.load_json_data(us_url) or []
            state_items.extend(us_items)
            log.debug(f'Found {len(state_items)} items')

            for row in state_items:
                item = RawDataItem(row, idx)
                log.debug(f'Parse row [{item.idx:5}]: {item.values}')
                if str(item.get('date')) != filter_day:
                    continue                # skip old data
                idx += 1
                if 'states' in item and 'fips' not in item:
                    state_id = None
                    fips_number = 0
                else:
                    state_id = item.get('state')
                    fips_number = item.get_int('fips')
                last_update_str = item.get('lastUpdateEt') or item.get('dateChecked')
                
                res = CovidDataItem(self.source_id, 'US', state_id,
                                    f'{fips_number:05}',                            # fips
                                    DateTimeHelper.get_end_day(day),                # datetime
                                    item.get_int('positive', 0),                    # confirmed
                                    item.get('death', 0),                           # deaths
                                    item.get('recovered', 0),                       # recovered
                                    item.get('hospitalized', 0),                    # active
                                    None,                                           # source_location
                                    Converter.parse_datetime(last_update_str),      # source_updated
                                    None, None
                                   )
                self.save_covid_data_item(db, idx, res)
            self.end_pulling(db, day, idx)
        return True


# pylint: disable=unused-argument
def run(day, args=None):
    CovidTrackingCollector().run(day)
    return True
