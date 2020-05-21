from ..base import Exporter
from cv19lib.utils import logger
from cv19lib.utils.helper import Converter, DateTimeHelper, DatabaseContext

log = logger.get_logger(__file__)


class TrendData(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'trend')
        self.name = ' trend covid data'

    def _load_data_on_day(self, db, day):
        items = {}
        for row in db.select('* FROM covid_data_stat WHERE date = %s;', [day]):
            # (country_id, state_id, fips, population, confirmed, deaths, recovered, active,
            #  geo_lat, geo_long, note, date, datetime, updated, source_updated, source_location,
            #  country_name, state_name, location_name, location_type) = row
            (country_id, state_id, fips, population,
                confirmed, deaths, recovered, active,
                geo_lat, geo_long,
                note, date, datetime, updated, _, _,
                _, _, location_name, location_type) = row
            item = {'country_id': country_id}
            if state_id:
                item['state_id'] = state_id
            if fips:
                item['fips'] = fips
            item['population'] = population
            item['confirmed'] = confirmed
            item['deaths'] = deaths
            item['recovered'] = recovered
            item['active'] = active
            item['geo_lat'] = Converter.to_string(geo_lat)
            item['geo_long'] = Converter.to_string(geo_long)
            item['date'] = DateTimeHelper.date_string(date)
            item['datetime'] = DateTimeHelper.datetime_string(datetime)
            item['updated'] = DateTimeHelper.datetime_string(updated)
            item['name'] = location_name
            item['type'] = location_type
            if note:
                item['note'] = note
            key = f'{country_id}-{state_id or ""}-{fips or ""}'
            items[key] = item
        return items

    def load_grouped_data(self, day):
        empty_item = {'confirmed': 0, 'deaths': 0, 'recovered': 0, 'active': 0}
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            latest_day = day
            log.info(f'Load latest data ({latest_day})...')
            latest = self._load_data_on_day(db, latest_day)

            day2old = DateTimeHelper.add_days(latest_day, -2)
            log.info(f'Load 2 days old data ({day2old})...')
            trend2days = self._load_data_on_day(db, day2old)

            day7old = DateTimeHelper.add_days(latest_day, -7)
            log.info(f'Load 7 days old data ({day7old})...')
            trend7days = self._load_data_on_day(db, day7old)

            log.info(f'Calculate trend items...')
            for key in latest:
                day0 = latest[key]
                day2 = trend2days.get(key, empty_item)
                day7 = trend7days.get(key, empty_item)
                item = {'country_id': day0['country_id']}
                if 'state_id' in day0:
                    item['state_id'] = day0['state_id']
                if 'fips' in day0:
                    item['fips'] = day0['fips']
                item['population'] = day0['population']
                item['confirmed'] = day0['confirmed']
                item['confirmed_trend2'] = day0['confirmed'] - day2['confirmed']
                item['confirmed_trend7'] = day0['confirmed'] - day7['confirmed']
                item['deaths'] = day0['deaths']
                item['deaths_trend2'] = day0['deaths'] - day2['deaths']
                item['deaths_trend7'] = day0['deaths'] - day7['deaths']
                item['recovered'] = day0['recovered']
                item['recovered_trend2'] = day0['recovered'] - day2['recovered']
                item['recovered_trend7'] = day0['recovered'] - day7['recovered']
                item['active'] = day0['active']
                item['active_trend2'] = day0['active'] - day2['active']
                item['active_trend7'] = day0['active'] - day7['active']
                item['geo_lat'] = day0['geo_lat']
                item['geo_long'] = day0['geo_long']
                item['date'] = day0['date']
                item['datetime'] = day0['datetime']
                item['name'] = day0['name']
                item['type'] = day0['type']
                self.add_item_to_export_all_levels(item)
            log.info(f'Calculate trend items complete.')
