# pylint: disable=R0801
import datetime
from pathlib import Path
from cv19srv.utils import logger
from cv19srv.utils.helper import Converter, DateTimeHelper, DatabaseContext
from .base import Exporter, DataType

log = logger.get_logger('trend')


class TrendData(Exporter):
    def __init__(self, output_dir: Path):
        super().__init__('trend covid data', output_dir / 'trend')

    def _load_data_on_day(self, db: DatabaseContext, day: datetime.datetime) -> None:
        """ Load data on the specific date and group it by location (country_id-state_id-fips)
        """
        items = {}
        sql = ('country_id, state_id, fips, population, confirmed, deaths, recovered, active, geo_lat, geo_long, '
               'note, date, datetime, updated, location_name, location_type FROM covid_data_stat WHERE date = %s;')
        for row in db.select(sql, [day]):
            (country_id, state_id, fips, population, confirmed, deaths, recovered, active, geo_lat, geo_long,
             _, date, collected_datetime, updated, location_name, location_type) = row

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
            item['datetime'] = DateTimeHelper.datetime_string(collected_datetime)
            item['updated'] = DateTimeHelper.datetime_string(updated)
            item['name'] = location_name
            item['type'] = location_type
            location_key = f'{country_id}-{state_id or ""}-{fips or ""}'
            items[location_key] = item
        return items

    def load_grouped_data(self, day: datetime.datetime) -> None:
        latest_day = day
        empty_item = {x.value: None for x in DataType}
        # calculate day offsets for each of the datatypes
        trend_days = {}
        for days in self.get_trend_periods():
            trend_days[str(days)] = DateTimeHelper.add_days(latest_day, -days)

        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            data_by_day = {}
            log.info(f'Load latest data ({latest_day})...')
            latest_data = self._load_data_on_day(db, latest_day)
            # load all data at the beginning of each trend periods
            for trend_key in trend_days:
                trend_day = trend_days[trend_key]
                log.info(f'Load {trend_key} days old data ({trend_day})...')
                data_by_day[trend_key] = self._load_data_on_day(db, trend_day)
                log.info(f'Loaded {len(data_by_day[trend_key])} for {trend_key} days old data ({trend_day}).')

            log.info(f'Calculate trend items...')
            for location_key in latest_data:
                log.debug(f'Processing {location_key}...')
                latest = latest_data[location_key]
                item = latest.copy()
                for trend_key in data_by_day:
                    data = data_by_day[trend_key].get(location_key, empty_item)
                    # calculate trends for each of the data types: confirmed, deaths, active, and etc.
                    for data_type in (DataType.CONFIRMED, DataType.DEATHS, DataType.ACTIVE, DataType.RECOVERED):
                        trend_value = self.calculate_delta(latest[data_type.value], data[data_type.value])
                        item[f'{data_type.value}_trend{trend_key}'] = trend_value
                self.add_item_to_export_all_levels(item)
            log.info(f'Calculate trend items complete.')


def run(day, output_dir: Path) -> bool:
    TrendData(output_dir).run(day)
    return True
