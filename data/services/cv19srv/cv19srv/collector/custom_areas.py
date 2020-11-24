#!/usr/bin/env python3
# #############################################################################
# Calculate data for the custom area
# Requirements: psycopg2
# #############################################################################
# pylint: disable=R0801
import datetime
from ..utils import logger
from ..utils.helper import DatabaseContext, DateTimeHelper
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
            new_items = []
            fips_for_deletion = []
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
                       'max(datetime), datetime::TIMESTAMP::DATE, source_id, '
                       'sum(hospitalized_currently), sum(hospitalized_cumulative), '
                       'sum(in_icu_currently), sum(in_icu_cumulative), '
                       'sum(on_ventilator_currently), sum(on_ventilator_cumulative) '
                       'FROM covid_data '
                       'WHERE datetime::TIMESTAMP::DATE = %s AND country_id = %s AND fips IN %s '
                       'GROUP BY country_id, datetime::TIMESTAMP::DATE, source_id '
                       'ORDER BY source_id;')
                params = [day, 'US', tuple(counties)]
                items = db.select(sql, params) or []
                log.debug(f'Found {len(items)} data items for the {area_fips} area')
                fips_for_deletion.append(area_fips)
                for item in items:
                    (country_id, confirmed, deaths, recovered, active, last_update, _, source_id,
                     hospitalized_currently, hospitalized_cumulative, in_icu_currently, in_icu_cumulative,
                     on_ventilator_currently, on_ventilator_cumulative) = item
                    state_id = country_id       # for the custom area the state_id is equal with the country_id
                    new_items.append(CovidDataItem(source_id, country_id, state_id,
                                                   area_fips,                                 # fips
                                                   collected_date,                            # datetime
                                                   confirmed,                                 # confirmed
                                                   deaths,                                    # deaths
                                                   recovered,                                 # recovered
                                                   active,                                    # active
                                                   area_name,                                 # source_location
                                                   last_update,                               # source_updated
                                                   geo_lat, geo_long,
                                                   hospitalized_currently,
                                                   hospitalized_cumulative,
                                                   in_icu_currently, in_icu_cumulative,
                                                   on_ventilator_currently,
                                                   on_ventilator_cumulative
                                                  ))
                log.info(f'Calculate data for {area_id} area on {day} day - done.')

            log.debug(f'Remove old custom areas on {day} day for {fips_for_deletion}')
            db.execute('DELETE FROM covid_data WHERE country_id=%s AND datetime=%s AND fips IN %s;',
                       ['US', DateTimeHelper.get_end_day(day), tuple(fips_for_deletion)])
            db.commit()
            self.save_covid_data_items(db, new_items)

            self.end_pulling(db, day, len(new_items))
            db.commit()
        return True


# pylint: disable=unused-argument
def run(day: datetime.datetime, args=None) -> bool:
    CustomAreasCollector().run(day)
    return True
