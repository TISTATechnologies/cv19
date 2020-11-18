#!/usr/bin/env python3
# #############################################################################
# Calculate data for the custom area
# Requirements: psycopg2
# #############################################################################
# pylint: disable=R0801
import datetime
from ..utils import logger
from ..utils.helper import DatabaseContext
from .base import Collector, CovidDataItem

log = logger.get_logger(__file__)


class CustomAreasCollector(Collector):
    """ Service to collect Covid-19 data from the Covid Tracking
    Site: https://covidtracking.com/api
    """
    def __init__(self):
        super().__init__('custom-area')

    def pull_data_by_day(self, day: datetime.datetime) -> None:
        log.info(f'Start calculate information - day={day}')
        collected_date = datetime.datetime(day.year, day.month, day.day, 23, 59, 59)
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            idx = 0
            for area_id in db.references.areas:
                areas = db.references.areas[area_id]
                if not areas:
                    log.warning(f'There are no parts on the {area_id} area')
                    continue
                area = areas[0]
                area_fips = area['fips']
                area_name = area['name']
                geo_lat = area['geo_lat']
                geo_long = area['geo_long']
                log.info(f'Calculating data for {area_id} area on {day} day...')
                # We are working only with the counties as a part for the area
                # We have 'type' in the DB for each parts and we can use it in a future
                counties = [x['area_id'] for x in areas]
                log.debug(f'Found {len(counties)} counties on the {area_fips} area')
                sql = ('country_id, '
                       'sum(confirmed), sum(deaths), sum(recovered), sum(active), '
                       'max(datetime), datetime::TIMESTAMP::DATE, source_id '
                       'FROM covid_data '
                       'WHERE datetime::TIMESTAMP::DATE = %s AND country_id = %s AND fips IN %s '
                       'GROUP BY country_id, datetime::TIMESTAMP::DATE, source_id '
                       'ORDER BY source_id;')
                params = [day, 'US', tuple(counties)]
                items = db.select(sql, params) or []
                log.debug(f'Found {len(items)} data items for the {area_fips} area')

                for item in items:
                    (country_id, confirmed, deaths, recovered, active, last_update, _, source_id) = item
                    state_id = country_id       # for the custom area the state_id is equal with the country_id
                    new_item = CovidDataItem(source_id, country_id, state_id,
                                             area_fips,                                 # fips
                                             collected_date,                            # datetime
                                             confirmed,                                 # confirmed
                                             deaths,                                    # deaths
                                             recovered,                                 # recovered
                                             active,                                    # active
                                             area_name,                                 # source_location
                                             last_update,                               # source_updated
                                             geo_lat, geo_long
                                            )
                    self.save_covid_data_item(db, idx, new_item)
                    idx += 1
                log.info(f'Calculate data for {area_id} area on {day} day - done.')
            self.end_pulling(db, day, idx)
        return True


# pylint: disable=unused-argument
def run(day: datetime.datetime, args=None) -> bool:
    CustomAreasCollector().run(day)
    return True
