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

from ..utils import logger
from ..utils.helper import CsvHelper, DatabaseContext, DateTimeHelper, MathHelper
from .base import Collector, CovidDataItem, RawDataItem

log = logger.get_logger(__file__)


# pylint: disable=too-many-locals, too-many-statements
class JHUCollector(Collector):
    MIN_STATE_DATE = datetime.datetime(2020, 4, 12).date()
    DATA_PATH = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data'
    STATE_ID_UNKNOWN = '--'

    def __init__(self):
        super().__init__('jhu', CovidDataItem.SOURCE_JHU)
        self.csv_helper = CsvHelper()

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
            yield RawDataItem(row, idx)

    # pylint: disable=unused-argument, useless-return
    def _parse_county_row_v1(self, day, item, db):                               # before 2020-03-23
        # Row header:
        # Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered
        log.warning(f'Parser V1: not implemented:')
        return None

    def _parse_county_row(self, collected_date, item, db):
        if collected_date.date() < datetime.datetime(2020, 3, 22).date():
            return self._parse_county_row_v1(collected_date, item, db)
        # Parser for a data after/on 2020-03-23
        # Row header:
        # FIPS,_,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key
        fips = item.get_fips(0)                                             # FIPS
        country_name = item.get(3)                                          # Country_Region
        state_name = item.get(2)                                            # Province_State

        country_id = db.references.find_country_id(country_name)            # country_id
        state_id = db.references.find_state_id(country_id, state_name)      # state_id
        if state_name and not state_id:                 # if we have a state name but can't find this state in the DB
            state_id = JHUCollector.STATE_ID_UNKNOWN    # we need to mark it with to prevent save it in DB
        elif country_id == 'US':
            state_type = db.references.states[country_id][state_id].get('type')
            # We need to use fips for US states and counties only
            if state_type not in ('state', 'federal district'):
                fips = None

        item = CovidDataItem(self.source_id, country_id, state_id, fips,
                             collected_date,                                # datetime
                             item.get_int(7, 0),                            # Confirmed
                             item.get_int(8, 0),                            # Deaths
                             item.get_int(9, None),                         # Recovered
                             item.get_int(10, None),                        # Active
                             item.get(11),                                  # Combined_Key
                             item.get_datetime(4, collected_date),          # Last_Update
                             item.get_decimal(5, 0),                        # Lat
                             item.get_decimal(6, 0),                        # Long_
                             None,                                          # hospitalized_currently
                             None,                                          # hospitalized_cumulative
                             None,                                          # in_icu_currently
                             None,                                          # in_icu_cumulative
                             None,                                          # on_ventilator_currently
                             None                                           # on_ventilator_cumulative
                             )
        return item

    def _parse_state_row(self, collected_date, item, db):
        # Row header:
        # Province_State,Country_Region,Last_Update,Lat,Long_, Confirmed,Deaths,Recovered,Active, FIPS,
        # Incident_Rate,People_Tested,People_Hospitalized, Mortality_Rate,UID,ISO3,Testing_Rate,Hospitalization_Rate
        state_name = item.get(0)                                            # Province_State
        country_id = item.get(1, 'US').upper()                              # Country Id
        state_id = db.references.find_state_id(country_id, state_name)      # state_id
        fips = item.get_fips(9)                                             # FIPS
        res = CovidDataItem(self.source_id, country_id, state_id, fips,
                            collected_date,
                            item.get_int(5, 0),                            # Confirmed
                            item.get_int(6, 0),                            # Deaths
                            item.get_int(7, None),                         # Recovered
                            item.get_int(8, None),                         # Active
                            f'{state_name},{country_id}',                  # source_location
                            item.get_datetime(2, collected_date),          # Last_Update
                            item.get_decimal(3, 0),                        # Lat
                            item.get_decimal(4, 0),                        # Long_
                            None,                                          # hospitalized_currently
                            None,                                          # hospitalized_cumulative
                            None,                                          # in_icu_currently
                            None,                                          # in_icu_cumulative
                            None,                                          # on_ventilator_currently
                            None                                           # on_ventilator_cumulative
                           )
        return res

    def _calculate_total_country_numbers(self, db, collected_date, country_data):
        """ If the country has states or counties in JHU data source,
        that's mean this country doesn't have summary numbers for the whole country.
        We need to calculate it.
        """
        log.info(f'Start calculating total country numbers')
        for country_id in [x for x in country_data if x]:
            if country_id == 'US':
                log.info(f'Skip calculation for "{country_id}" country: we will get this information '
                         'from CovidTracking.com')
                continue
            # we need to check/calculate summary for the countries with more the 1 item
            if len(country_data[country_id]) < 2:
                log.info(f'Skip calculation for "{country_id}" country: we have only one item')
                continue
            country_item = db.references.countries[country_id]
            total_item = CovidDataItem(self.source_id, country_id, None, None, collected_date, 0, 0, 0, 0,
                                       country_item['name'], datetime.datetime(2000, 1, 1),
                                       country_item['geo_lat'], country_item['geo_long'],
                                       None, None, None, None, None, None)
            log.debug(f'Total item: {total_item}')
            for item in country_data[country_id]:
                log.debug(f'Processing item: {item}')
                if not item.state_id and not item.fips:         # looks like we have item with summary numbers
                    log.info(f'Skip calculation for {country_id}: we already have an item in the DB')
                    total_item = None
                    break
                if item.state_id != JHUCollector.STATE_ID_UNKNOWN and \
                    country_id in db.references.states and \
                    (item.state_id not in db.references.states[country_id] or \
                        not db.references.states[country_id][item.state_id].get('use_in_summary')):
                    log.info(f'Exclude "{item.state_id}/{item.fips}" state from the calculation for "{country_id}" '
                             f'country: location = {item.source_location}')
                    continue
                log.debug(f'Include "{item.state_id}/{item.fips}" state to the calculation for "{country_id}" '
                          f'country: location = {item.source_location}')
                total_item.source_updated = max(total_item.source_updated, item.source_updated)
                total_item.confirmed += item.confirmed
                total_item.deaths += item.deaths
                total_item.recovered = MathHelper.sum(total_item.recovered, item.recovered)
                # total_item.active = MathHelper.sum(total_item.active, item.active)
                total_item.active = total_item.active_calculated

                total_item.hospitalized_currently = MathHelper.sum(total_item.hospitalized_currently,
                                                                   item.hospitalized_currently)
                total_item.hospitalized_cumulative = MathHelper.sum(total_item.hospitalized_cumulative,
                                                                    item.hospitalized_cumulative)
                total_item.in_icu_currently = MathHelper.sum(total_item.in_icu_currently,
                                                             item.in_icu_currently)
                total_item.in_icu_cumulative = MathHelper.sum(total_item.in_icu_cumulative,
                                                              item.in_icu_cumulative)
                total_item.on_ventilator_currently = MathHelper.sum(total_item.on_ventilator_currently,
                                                                    item.on_ventilator_currently)
                total_item.on_ventilator_cumulative = MathHelper.sum(total_item.on_ventilator_cumulative,
                                                                     item.on_ventilator_cumulative)
            if total_item:
                log.debug(f'Calculate summary item for "{country_id}" country - success: {total_item}')
                if total_item.country_id == 'US' and not total_item.state_id and not total_item.fips:
                    total_item.fips = '00000'
                country_data[country_id].append(total_item)

        log.info(f'Calculate total country numbers - complete')

    def _clean_old_data(self, collected_date):
        day = collected_date.date()
        with DatabaseContext() as db:
            log.info(f'Remove all old covid data on {day} day (source={self.source_id})')
            db.execute('DELETE FROM covid_data WHERE source_id=%s AND datetime=%s;',
                       [self.source_id, DateTimeHelper.get_end_day(day).strftime('%Y-%m-%d %H:%M:%S')])
            db.commit()

    def _pull_data_and_save(self, data_type: str, url: str, collected_date, row_parser,
                            need_to_calculate_total_country_numbers=False):
        day = collected_date.date()
        log.info(f'Start pull {data_type} information - day={day}')
        country_data = {}
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            for item in self._read_jhu_dataline(url):
                log.debug(f'Parse row [{item.idx:5}]: {item.values}')
                new_item = row_parser(collected_date, item, db)
                if not new_item.country_id:
                    log.warning(f'! Can\'t parse country from the row: {new_item}')
                    continue
                if new_item.country_id not in country_data:
                    country_data[new_item.country_id] = []
                country_data[new_item.country_id].append(new_item)
            log.info(f'End pull {data_type} information from the source')
            if need_to_calculate_total_country_numbers:
                self._calculate_total_country_numbers(db, collected_date, country_data)
            new_items = {}
            log.info(f'Saving it to the DB')
            for country_id in country_data:
                for item in country_data[country_id]:
                    if item.state_id == JHUCollector.STATE_ID_UNKNOWN:
                        log.debug(f'Skip saving item: unknown state: {item}')
                    else:
                        item_key = item.get_unique_key()
                        if item_key in new_items:
                            log.warning(f'Duplicate: {item}')
                            self.counter_items_duplicate += 1
                        else:
                            new_items[item_key] = item
                            log.debug(f'Add item: {item}')

            new_items_values = [x for x in new_items.values()]
            new_items_len = len(new_items_values)
            self.save_covid_data_items(db, new_items_values)
            log.info(f'Save data into the DB complete ({new_items_len} items)')
            self.end_pulling(db, day, new_items_len)
            db.commit()
        log.info(f'End pull {data_type} information: found {new_items_len} items, day={day}')
        return True

    def pull_data_by_day(self, day):
        collected_date = datetime.datetime(day.year, day.month, day.day, 23, 59, 59)

        self._clean_old_data(collected_date)

        url = ''.join([f'{JHUCollector.DATA_PATH}/csse_covid_19_daily_reports/{day.strftime("%m-%d-%Y")}.csv'])
        self._pull_data_and_save('county', url, collected_date, self._parse_county_row, True)

        # We are collect US state level data from CovidTracking
        # url = ''.join([f'{JHUCollector.DATA_PATH}/csse_covid_19_daily_reports_us/{day.strftime("%m-%d-%Y")}.csv'])
        # self._pull_data_and_save('state', url, collected_date, self._parse_state_row, False)


# pylint: disable=unused-argument
def run(day, args=None):
    JHUCollector().run(day)
    return True
