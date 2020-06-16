import json
from cv19srv.config import config
from cv19srv.utils import logger
from cv19srv.utils.helper import CsvHelper, DateTimeHelper

log = logger.get_logger('base-export')


class Location:
    def __init__(self, country_id, state_id, fips):
        self.country_id = country_id or ''
        self.state_id = state_id
        self.fips = fips

    @property
    def is_country(self):
        return self.state_id is None

    @property
    def is_state(self):
        return self.state_id and (not self.fips or self.fips.startswith('000'))

    @property
    def is_county(self):
        return self.fips and not self.fips.startswith('000')

    def get_file_path(self, version=1):
        if self.is_country:
            return f'{self.country_id.lower()}'
        if self.is_state:
            return f'{self.country_id.lower()}/{self.state_id.lower()}'
        if self.is_county:
            if version == 1:
                return f'{self.country_id.lower()}/{self.state_id.lower()}/{self.fips}'
            if version == 2:
                return f'{self.country_id.lower()}/{self.fips[0:2]}/{self.fips}'
        raise ValueError('Incorrect vlues: country_id, state_id, fips')

    def __eq__(self, other):
        return str(self) == str(other)

    def __str__(self):
        return f'{self.country_id}-{self.state_id}-{self.fips}'


class Exporter:
    def __init__(self, output_dir):
        self.name = 'base'
        self.output_dir = output_dir
        self.items_for_export = {}
        self.is_latest = False

    def load_grouped_data(self, day):
        raise NotImplementedError()

    def get_location(self, country_id, state_id, fips):
        return Location(country_id, state_id, fips)

    def run(self, day):
        self.is_latest = day == DateTimeHelper.get_yesterday_date()
        log_day = f'{day}/latest' if self.is_latest else day
        log.info(f'Start export {self.name} [{log_day}] in {self.output_dir}...')
        self.load_grouped_data(day)
        self._save_table_data_to_static_files(day)
        log.info(f'End export {self.name} [{log_day}] into {self.output_dir}')

    def calculate_delta(self, val1, val2):
        if val1 is None or val2 is None or val2 == 0:
            return None
        return val1 - val2

    def calculate_trend(self, val1, val2):
        if val1 is None or val2 is None or val2 == 0:
            return None
        return round((val1 - val2) / val2, 4)

    def add_list_item_to_dict_safe(self, dict_obj, key, value):
        if key not in dict_obj:
            dict_obj[key] = []
        dict_obj[key].append(value)

    def add_item_to_export_safe(self, key, value):
        self.add_list_item_to_dict_safe(self.items_for_export, key, value)

    def add_item_to_export_all_levels(self, item):
        country_id = item['country_id']
        state_id = item.get('state_id')
        fips = item.get('fips')
        top_level = country_id.lower()
        # we are using '_all' file to group all data on the specific level (all - for a country or state)
        if not state_id:                                                        # country level
            self.add_item_to_export_safe('all-countries', item)                     # /all-countries.json
            self.add_item_to_export_safe(top_level, item)                           # /<country_code>.json
        elif not fips or fips.startswith('000'):                                # state level
            self.add_item_to_export_safe(f'{top_level}/all-states', item)           # /us/all-states.json
            self.add_item_to_export_safe(f'{top_level}/{state_id.lower()}', item)   # /us/dc.json
        elif fips:                                                              # county level
            second_level1 = f'{top_level}/{state_id.lower()}'
            self.add_item_to_export_safe(f'{second_level1}/all-counties', item)     # /us/dc/all-counties.json
            self.add_item_to_export_safe(f'{second_level1}/{fips}', item)           # /us/dc/11001.json
            self.add_item_to_export_safe(f'{top_level}/all-counties', item)         # /us/all-counties.json
            second_level2 = f'{top_level}/{fips[0:2]}'
            self.add_item_to_export_safe(f'{second_level2}/all-counties', item)     # /us/11/all-counties.json
            self.add_item_to_export_safe(f'{second_level2}/{fips}', item)           # /us/11/11001.json
        else:
            log.error(f'Unknown data level: {item}')

    def _save_to_json(self, output_file, data):
        if not config.format_json:
            log.debug(f'Skip save to the JSON file: {output_file}')
            return
        output_file.parent.mkdir(parents=True, exist_ok=True)
        data_len = len(data or [])
        log.debug(f'Saving {data_len} items into the file {output_file}...')
        with output_file.open('w') as fo:
            json.dump(data or [], fo,
                      indent=None if config.minify else 2,
                      separators=(',', ':') if config.minify else None)
        log.info(f'Save {data_len} items into the file {output_file}')

    def _save_to_csv(self, output_file, data):
        if not config.format_csv:
            log.debug(f'Skip save to the CSV file: {output_file}')
            return
        csv_heper = CsvHelper()
        data_for_csv = data or {}
        data_len = len(data_for_csv)
        log.debug(f'Saving {data_len} items into the file {output_file}...')
        header = data_for_csv[0].keys() if len(data_for_csv) > 0 else []
        values = [item.values() for item in data_for_csv]
        csv_heper.write_csv_file(output_file, header, values)
        log.info(f'Save {data_len} items into the file {output_file}')

    def _save_table_data_to_static_files(self, day):
        log.debug('Save data into the files...')
        days = [day.strftime('%Y%m%d')]
        if self.is_latest:
            days.append('latest')
        items = self.items_for_export
        for fname in items:
            for day_str in days:
                if fname is not None:
                    self._save_data_to_file(day_str, fname, items[fname])
                else:
                    self._save_data_to_file(None, day_str, items[fname])

    def save_loc_data_to_file(self, dir_name, location, data):
        self._save_data_to_file(dir_name, location.get_file_path(), data)
        if location.is_county:
            self._save_data_to_file(dir_name, location.get_file_path(2), data)

    def _save_data_to_file(self, dir_name, file_name, data):
        self._save_to_json(self.output_dir / (dir_name or '') / f'{file_name}.json', data)
        self._save_to_csv(self.output_dir / (dir_name or '') / f'{file_name}.csv', data)
