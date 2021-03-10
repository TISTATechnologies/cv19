# pylint: disable=R0801
import datetime
from pathlib import Path
from cv19srv.collector import ENGINES
from cv19srv.utils import logger
from cv19srv.utils.helper import Converter, DateTimeHelper, DatabaseContext
from .base import Exporter

log = logger.get_logger(__file__)


# pylint: disable=too-many-branches
class CovidDataExporter(Exporter):
    def __init__(self, output_dir: Path):
        super().__init__('covid data', output_dir / 'daily')

    def load_grouped_data(self, day: datetime.datetime) -> None:
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            sql = ('country_id, state_id, fips, population, confirmed, deaths, recovered, active, '
                   'geo_lat, geo_long, note, date, datetime, updated, location_name, location_type, '
                   'hospitalized_currently, hospitalized_cumulative, '
                   'in_icu_currently, in_icu_cumulative, '
                   'on_ventilator_currently, on_ventilator_cumulative, '
                   'vaccination_distributed, vaccination_administered, '
                   'vaccination_adm_dose1, vaccination_adm_dose2 ')
            if self.is_day_latest(day):
                sql += ' FROM covid_data_stat_latest;'
                values = None
            else:
                sql += ' FROM covid_data_stat WHERE date = %s;'
                values = [day]
            for row in db.select(sql, values):
                (country_id, state_id, fips, population,
                 confirmed, deaths, recovered, active,
                 geo_lat, geo_long,
                 note, date, collected_datetime, _, location_name, location_type,
                 hospitalized_currently, hospitalized_cumulative,
                 in_icu_currently, in_icu_cumulative,
                 on_ventilator_currently, on_ventilator_cumulative,
                 vaccination_distributed, vaccination_administered,
                 vaccination_adm_dose1, vaccination_adm_dose2) = row
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
                if hospitalized_currently is not None:
                    item['hospitalized_currently'] = hospitalized_currently
                if hospitalized_cumulative is not None:
                    item['hospitalized_cumulative'] = hospitalized_cumulative
                if in_icu_currently is not None:
                    item['in_icu_currently'] = in_icu_currently
                if in_icu_cumulative is not None:
                    item['in_icu_cumulative'] = in_icu_cumulative
                if on_ventilator_currently is not None:
                    item['on_ventilator_currently'] = on_ventilator_currently
                if on_ventilator_cumulative is not None:
                    item['on_ventilator_cumulative'] = on_ventilator_cumulative
                if vaccination_distributed is not None:
                    item['vaccination_distributed'] = vaccination_distributed
                if vaccination_administered is not None:
                    item['vaccination_administered'] = vaccination_administered
                if vaccination_adm_dose1 is not None:
                    item['vaccination_adm_dose1'] = vaccination_adm_dose1
                if vaccination_adm_dose2 is not None:
                    item['vaccination_adm_dose2'] = vaccination_adm_dose2
                item['geo_lat'] = Converter.to_string(geo_lat)
                item['geo_long'] = Converter.to_string(geo_long)
                item['date'] = DateTimeHelper.date_string(date)
                item['datetime'] = DateTimeHelper.datetime_string(collected_datetime)
                item['name'] = location_name
                item['type'] = location_type
                if note:
                    item['note'] = note
                self.add_item_to_export_all_levels(item)


class ExecutiveOrdersExporter(Exporter):
    def __init__(self, output_dir: Path):
        super().__init__('executive orders', output_dir / 'executive-orders')

    def load_grouped_data(self, day: datetime.datetime) -> None:
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
    def __init__(self, output_dir: Path):
        super().__init__('source', output_dir / 'source')

    def load_grouped_data(self, day: datetime.datetime) -> None:
        for item in ENGINES.values():
            source_item = {}
            for field in ['name', 'url', 'description']:
                source_item[field] = item.get(field)
            # Do not export sources without a name
            if source_item.get('name'):
                log.debug(f'Export source: {source_item.get("name")} ({source_item.get("url")})')
                self.add_item_to_export_safe(None, source_item)


def run(day, output_dir: Path) -> bool:
    SourceExporter(output_dir).run(day)
    ExecutiveOrdersExporter(output_dir).run(day)
    CovidDataExporter(output_dir).run(day)
    return True
