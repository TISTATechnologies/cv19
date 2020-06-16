# pylint: disable=R0801
from cv19srv.collector import ENGINES
from cv19srv.utils import logger
from cv19srv.utils.helper import Converter, DateTimeHelper, DatabaseContext
from .base import Exporter

log = logger.get_logger(__file__)


class CovidDataExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'daily')
        self.name = 'covid data'

    def load_grouped_data(self, day):
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            if self.is_latest:
                sql = ('country_id, state_id, fips, population, confirmed, deaths, recovered, active, '
                       'geo_lat, geo_long, note, date, datetime, updated, location_name, location_type '
                       'FROM covid_data_stat_latest;')
                values = None
            else:
                sql = ('country_id, state_id, fips, population, confirmed, deaths, recovered, active, '
                       'geo_lat, geo_long, note, date, datetime, updated, location_name, location_type '
                       'FROM covid_data_stat WHERE date = %s;')
                values = [day]
            for row in db.select(sql, values):
                (country_id, state_id, fips, population,
                 confirmed, deaths, recovered, active,
                 geo_lat, geo_long,
                 note, date, datetime, updated, location_name, location_type) = row
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


class ExecutiveOrdersExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'executive-orders')
        self.name = 'executive orders'

    def load_grouped_data(self, day):
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            for row in db.select('* FROM covid_info_link;'):
                (_, country_id, state_id, fips, _, url, note, published, created) = row
                item = {'country_id': country_id, 'state_id': state_id, 'fips': fips,
                        'url': url, 'published': DateTimeHelper.datetime_string(published),
                        'created': DateTimeHelper.datetime_string(created)}
                if note:
                    item['note'] = note
                self.add_item_to_export_all_levels(item)


class SourceExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'source')
        self.name = 'source'

    def load_grouped_data(self, day):
        for item in ENGINES.values():
            source_item = {}
            for field in ['name', 'url', 'description']:
                source_item[field] = item.get(field)
            self.add_item_to_export_safe(None, source_item)


def run(day, output_dir):
    SourceExporter(output_dir).run(day)
    ExecutiveOrdersExporter(output_dir).run(day)
    CovidDataExporter(output_dir).run(day)
    return True
