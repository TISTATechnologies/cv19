from cv19lib.utils import logger
from cv19lib.utils.helper import Converter, DateTimeHelper, DatabaseContext
from ..base import Exporter

log = logger.get_logger(__file__)


class TrendData(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'trend')
        self.name = ' trend covid data'

    def _load_data_on_day(self, db, day):
        """ Load data on the specific date and group it by location (country_id-state_id-fips)
        """
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

    def _delta(self, val1, val2):
        if val1 is None or val2 is None:
            return None
        return val1 - val2

    def load_grouped_data(self, day):
        latest_day = day
        empty_item = {'confirmed': None, 'deaths': None, 'recovered': None, 'active': None}
        trend_days = {
            '2': DateTimeHelper.add_days(latest_day, -2),
            '7': DateTimeHelper.add_days(latest_day, -7),
            '30': DateTimeHelper.add_days(latest_day, -30),
            '60': DateTimeHelper.add_days(latest_day, -60),
            '90': DateTimeHelper.add_days(latest_day, -90)
        }
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            data_by_day = {}
            log.info(f'Load latest data ({latest_day})...')
            latest = self._load_data_on_day(db, latest_day)
            for trend_key in trend_days:
                trend_day = trend_days[trend_key]
                log.info(f'Load {trend_key} days old data ({trend_day})...')
                data_by_day[trend_key] = self._load_data_on_day(db, trend_day)
                log.info(f'Loaded {len(data_by_day[trend_key])} for {trend_key} days old data ({trend_day}).')

            log.info(f'Calculate trend items...')
            for key in latest:
                log.debug(f'Processing {key}...')
                day0 = latest[key]
                item = {'country_id': day0['country_id']}
                if 'state_id' in day0:
                    item['state_id'] = day0['state_id']
                if 'fips' in day0:
                    item['fips'] = day0['fips']
                item['population'] = day0['population']
                item['confirmed'] = day0['confirmed']
                item['deaths'] = day0['deaths']
                item['recovered'] = day0['recovered']
                item['active'] = day0['active']
                item['geo_lat'] = day0['geo_lat']
                item['geo_long'] = day0['geo_long']
                item['date'] = day0['date']
                item['datetime'] = day0['datetime']
                item['name'] = day0['name']
                item['type'] = day0['type']
                for trend_key in data_by_day:
                    data = data_by_day[trend_key].get(key, empty_item)
                    item[f'confirmed_trend{trend_key}'] = self._delta(day0['confirmed'], data['confirmed'])
                    item[f'deaths_trend{trend_key}'] = self._delta(day0['deaths'], data['deaths'])
                    item[f'recovered_trend{trend_key}'] = self._delta(day0['recovered'], data['recovered'])
                    item[f'active_trend{trend_key}'] = self._delta(day0['active'], data['active'])
                self.add_item_to_export_all_levels(item)
            log.info(f'Calculate trend items complete.')
