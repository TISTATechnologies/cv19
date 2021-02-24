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
        super().__init__('covidtracking', CovidDataItem.SOURCE_COVIDTRACKING)

    def pull_data_by_day(self, day):
        filter_day = day.strftime("%Y%m%d")
        log.info(f'Start pull information - day={day}')
        states_url = f'http://covidtracking.com/api/v1/states/daily.json'
        us_url = f'http://covidtracking.com/api/v1/us/daily.json'
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            state_items = self.load_json_data(states_url) or []
            us_items = self.load_json_data(us_url) or []
            state_items.extend(us_items)
            log.debug(f'Found {len(state_items)} items')

            log.info(f'Remove old US data on {day} day (source={self.source_id})')
            db.execute('DELETE FROM covid_data WHERE source_id=%s AND country_id=%s AND datetime=%s;',
                       [self.source_id, 'US', DateTimeHelper.get_end_day(day)])
            new_items = []
            idx = 0
            for row in state_items:
                idx += 1
                item = RawDataItem(row, idx)
                log.debug(f'Parse row [{item.idx:5}]: {item.values}')
                if str(item.get('date')) != filter_day:
                    continue                # skip old data
                if 'states' in item and 'fips' not in item:
                    state_id = None
                    fips_number = 0
                else:
                    state_id = item.get('state')
                    fips_number = item.get_int('fips')
                last_update_str = item.get('lastUpdate') or item.get('lastUpdateEt') or item.get('dateChecked')
                if not last_update_str:
                    log.warning(f'Incorrect last_update value = {last_update_str} for {state_id}/{fips_number}. '
                                f'Use {day} as a value.')
                    last_update_str = DateTimeHelper.datetime_string(DateTimeHelper.get_end_day(day))

                new_item = CovidDataItem(self.source_id, 'US', state_id,
                                         f'{fips_number:05}',                            # fips
                                         DateTimeHelper.get_end_day(day),                # datetime
                                         item.get_int('positive', 0),                    # confirmed
                                         item.get('death', 0),                           # deaths
                                         item.get('recovered', None),                    # recovered
                                         None,                                           # active
                                         None,                                           # source_location
                                         Converter.parse_datetime(last_update_str),      # source_updated
                                         None, None,                                     # geo_lat, geo_long
                                         item.get_int('hospitalizedCurrently', None),    # hospitalized_currently
                                         item.get_int('hospitalizedCumulative', None),   # hospitalized_cumulative
                                         item.get_int('inIcuCurrently', None),           # in_icu_currently
                                         item.get_int('inIcuCumulative', None),          # in_icu_cumulative
                                         item.get_int('onVentilatorCurrently', None),    # on_ventilator_currently
                                         item.get_int('onVentilatorCumulative', None),   # on_ventilator_cumulative
                                        )
                new_item.active = new_item.active_calculated
                new_items.append(new_item)
            self.save_covid_data_items(db, new_items)
            self.end_pulling(db, day, len(new_items))
            db.commit()
        return True


# pylint: disable=unused-argument
def run(day, args=None):
    CovidTrackingCollector().run(day)
    return True
