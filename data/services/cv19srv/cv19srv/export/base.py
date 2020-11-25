import datetime
from enum import Enum
from pathlib import Path
from cv19srv.config import config
from cv19srv.utils import logger
from cv19srv.utils.helper import CsvHelper, DateTimeHelper, JsonHelper

log = logger.get_logger('base-export')


class DataType(Enum):
    CONFIRMED = 'confirmed'
    DEATHS = 'deaths'
    ACTIVE = 'active'
    RECOVERED = 'recovered'
    HOSPITALIZED = 'hospitalized'


class Location:
    def __init__(self, country_id: str, state_id: str, fips: str):
        self.country_id = country_id or ''
        self.state_id = state_id
        self.fips = fips

    @property
    def is_country(self) -> bool:
        return self.state_id is None

    @property
    def is_state(self) -> bool:
        return self.state_id and (not self.fips or self.fips.startswith('000'))

    @property
    def is_county(self) -> bool:
        return self.fips and not self.fips.startswith('000')

    def get_file_path(self, use_state_fips_for_county=False) -> str:
        """ Calculate output file path for the specific location
        use_state_fips_for_county = False - calculate path for the county with the state_id
        use_state_fips_for_county = True - calculate path for the county with the state_fips
        """
        if self.is_country:
            return f'{self.country_id.lower()}'
        if self.is_state:
            return f'{self.country_id.lower()}/{self.state_id.lower()}'
        if self.is_county:
            if use_state_fips_for_county:
                return f'{self.country_id.lower()}/{self.fips[0:2]}/{self.fips}'
            return f'{self.country_id.lower()}/{self.state_id.lower()}/{self.fips}'
        raise ValueError('Incorrect values: country_id, state_id, fips')

    def __eq__(self, other) -> bool:
        return str(self) == str(other)

    def __str__(self) -> str:
        return f'{self.country_id}-{self.state_id}-{self.fips}'


class Exporter:
    def __init__(self, name: str, output_dir: Path):
        self.name = name or 'base'
        self._output_dir = output_dir
        self._items_for_export = {}

    def get_trend_periods(self):
        return [2, 7, 14, 30, 60, 90]

    def load_grouped_data(self, day: datetime.datetime) -> None:
        raise NotImplementedError()

    def get_location(self, country_id: str, state_id: str, fips: str) -> Location:
        return Location(country_id, state_id, fips)

    def is_day_latest(self, day):
        return day == DateTimeHelper.get_yesterday_date()

    def run(self, day: datetime.datetime) -> None:
        log.info(f'Start export {self.name} [{day}] in {self._output_dir}...')
        self.load_grouped_data(day)
        self._save_table_data_to_static_files(day)
        log.info(f'End export {self.name} [{day}] into {self._output_dir}')

    def calculate_delta(self, val1: int, val2: int) -> int:
        if val1 is None or val2 is None or val2 == 0:
            return None
        return val1 - val2

    def calculate_trend(self, val1: int, val2: int) -> float:
        if val1 is None or val2 is None or val2 == 0:
            return None
        return round((val1 - val2) / val2, 4)

    def add_item_to_export_safe(self, path: str, value) -> None:
        if path not in self._items_for_export:
            self._items_for_export[path] = []
        self._items_for_export[path].append(value)

    def add_item_to_export_all_levels(self, item: dict) -> None:
        """ Add item to the list for export on all levels by the data type: country, state, county
        """
        country_id = item['country_id']
        state_id = item.get('state_id')
        fips = item.get('fips')
        top_level = country_id.lower()
        location = self.get_location(country_id, state_id, fips)
        # we are using '_all' file to group all data on the specific level (all - for a country or state)
        if location.is_country:                                                 # country level
            self.add_item_to_export_safe('all-countries', item)                     # /all-countries.json
            self.add_item_to_export_safe(top_level, item)                           # /<country_code>.json
        elif location.is_state:                                                 # state level
            self.add_item_to_export_safe(f'{top_level}/all-states', item)           # /us/all-states.json
            self.add_item_to_export_safe(f'{top_level}/{state_id.lower()}', item)   # /us/dc.json
        elif location.is_county:                                                # county level
            second_level1 = f'{top_level}/{state_id.lower()}'
            self.add_item_to_export_safe(f'{second_level1}/all-counties', item)     # /us/dc/all-counties.json
            self.add_item_to_export_safe(f'{second_level1}/{fips}', item)           # /us/dc/11001.json
            self.add_item_to_export_safe(f'{top_level}/all-counties', item)         # /us/all-counties.json
            second_level2 = f'{top_level}/{fips[0:2]}'
            self.add_item_to_export_safe(f'{second_level2}/all-counties', item)     # /us/11/all-counties.json
            self.add_item_to_export_safe(f'{second_level2}/{fips}', item)           # /us/11/11001.json
        else:
            log.error(f'Unknown data level: {item}')

    def _save_table_data_to_static_files(self, day: datetime.datetime) -> None:
        log.debug('Save data into the files...')
        # If the day = yesterday then we need create two files: day and 'latest'
        days = [day.strftime('%Y%m%d')]
        if self.is_day_latest(day):
            days.append('latest')
        items = self._items_for_export
        for fname in items:
            for day_str in days:
                if fname is not None:
                    self._save_data_to_file(day_str, fname, items[fname])
                else:
                    self._save_data_to_file(None, day_str, items[fname])

    def save_loc_data_to_file(self, dir_name: str, location: Location, items: list) -> None:
        self._save_data_to_file(dir_name, location.get_file_path(use_state_fips_for_county=False), items)
        if location.is_county:
            self._save_data_to_file(dir_name, location.get_file_path(use_state_fips_for_county=True), items)

    def _save_data_to_file(self, dir_name: str, file_name: str, items: list) -> None:
        data_dir = self._output_dir / (dir_name or '')
        json_file = data_dir / f'{file_name}.json'
        csv_file = data_dir / f'{file_name}.csv'
        if not config.format_json:
            log.debug(f'Skip save to the JSON file: {json_file}')
        else:
            JsonHelper.save_list(json_file, items)
        if not config.format_csv:
            log.debug(f'Skip save to the CSV file: {csv_file}')
        else:
            CsvHelper.save_list(csv_file, items)
