#!/usr/bin/env python3
# #############################################################################
# Pull information from the CDC site: https://cdc.gov
# Requirements: requests, psycopg2
# #############################################################################
# pylint: disable=R0801
from ..utils import logger
from ..utils.helper import Converter, DatabaseContext, DateTimeHelper
from .base import Collector, CovidDataItem, RawDataItem

log = logger.get_logger(__file__)


class CDCCollector(Collector):
    """ Service to collect Covid-19 data from the CDC
    Site: https://cdc.gov
    """
    def __init__(self):
        super().__init__('cdc', CovidDataItem.SOURCE_CDC)

    def pull_data_by_day(self, day):
        filter_days = [day.strftime('%Y-%m-%d')]
        yesterday = DateTimeHelper.get_yesterday_date()
        today = DateTimeHelper.get_today_date()
        if day == yesterday:
            filter_days.append(today.strftime('%Y-%m-%d'))
        log.info(f'Start pull information - day={day}')
        url = f'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data'
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            raw_data = (self.load_json_data(url) or [{}])[0]
            items = raw_data['vaccination_data']
            log.debug(f'Found {len(items)} items')
            idx = 0
            last_update_str = DateTimeHelper.datetime_string(DateTimeHelper.get_end_day(day))
            us_item = CovidDataItem(self.source_id, 'US', None, '00000',
                                    collected_datetime=DateTimeHelper.get_end_day(day),
                                    source_updated=Converter.parse_datetime(last_update_str),
                                    vaccination_distributed=0, vaccination_administered=0,
                                    vaccination_adm_dose1=0, vaccination_adm_dose2=0)
            for row in items:
                idx += 1
                item = RawDataItem(row, idx)
                log.debug(f'Parse row [{item.idx:5}]: {item.values}')
                item_day = str(item.get('Date'))
                if item_day not in filter_days:
                    log.warning(f'Skip wrong data (day={item_day}).')
                    continue
                country_id = 'US'
                state_id = item.get('Location')
                fips = db.references.find_state_fips(country_id, state_id)
                if fips is None or state_id == 'US':
                    log.warning(f'Skip wrong data (fips={fips}, state_id={state_id}).')
                    continue
                new_item = CovidDataItem(self.source_id, country_id, state_id, fips,
                                         collected_datetime=DateTimeHelper.get_end_day(day),
                                         source_updated=Converter.parse_datetime(last_update_str),
                                         vaccination_distributed=item.get_int('Doses_Distributed', None),
                                         vaccination_administered=item.get_int('Doses_Administered', None),
                                         vaccination_adm_dose1=item.get_int('Administered_Dose1', None),
                                         vaccination_adm_dose2=item.get_int('Administered_Dose2', None))
                log.info(f'Item: {new_item.country_id},{new_item.state_id},{new_item.fips},{new_item.datetime},'
                         f'{new_item.vaccination_distributed},{new_item.vaccination_administered},'
                         f'{new_item.vaccination_adm_dose1},{new_item.vaccination_adm_dose2}')
                us_item += new_item
                new_item.active = new_item.active_calculated
                self.save_covid_data_item(db, idx, new_item)
            self.save_covid_data_item(db, idx, us_item)
            self.end_pulling(db, day, idx)
            db.commit()
        return True


# pylint: disable=unused-argument
def run(day, args=None):
    CDCCollector().run(day)
    return True
