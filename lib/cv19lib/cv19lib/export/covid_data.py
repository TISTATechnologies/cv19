from .base import Exporter
from ..utils import logger
from ..utils.helper import Converter, DateTimeHelper, DatabaseContext

log = logger.get_logger(__file__)


class CovidDataExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'daily')
        self.name = 'covid data'

    def load_grouped_data(self, day):
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            if self.is_latest:
                sql = '* FROM covid_data_stat_latest;'
                values = None
            else:
                sql = '* FROM covid_data_stat WHERE date = %s;'
                values = [day]
            for row in db.select(sql, values):
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
                self.add_item_to_export_all_levels(item)
