import json
from cv19lib.config import config
from cv19lib.utils import logger
from cv19lib.utils.helper import CsvHelper, DateTimeHelper

log = logger.get_logger('export-base')


class Exporter:
    def __init__(self, output_dir):
        self.name = 'base'
        self.output_dir = output_dir
        self.items_for_export = {}
        self.is_latest = False

    def load_grouped_data(self, day):
        raise NotImplementedError()

    def run(self, day):
        self.is_latest = day == DateTimeHelper.get_yesterday_date()
        log_day = f'{day}/latest' if self.is_latest else day
        log.info(f'Start export {self.name} [{log_day}] in {self.output_dir}...')
        # {'file_name': [item1, item2]}
        self.load_grouped_data(day)
        self._save_table_data_to_static_files(day, self.output_dir)
        log.info(f'End export {self.name} [{log_day}] into {self.output_dir}')

    def add_item_to_export_safe(self, key, value):
        if key not in self.items_for_export:
            self.items_for_export[key] = []
        self.items_for_export[key].append(value)

    def add_item_to_export_all_levels(self, item):
        country_id = item['country_id']
        state_id = item.get('state_id')
        fips = item.get('fips')
        top_level = country_id.lower()
        # we are using '_all' file to group all data in the specific level (all - for a country or state)
        if not state_id:                                    # country level
            self.add_item_to_export_safe('all-countries', item)                        # /all-countries.json
            self.add_item_to_export_safe(top_level, item)                              # /<country_code>.json
        elif not fips or fips.startswith('000'):            # state level
            self.add_item_to_export_safe(f'{top_level}/all-states', item)              # /us/all-states.json
            self.add_item_to_export_safe(f'{top_level}/{state_id.lower()}', item)      # /us/dc.json
        elif fips:                                          # county level
            second_level1 = f'{top_level}/{state_id.lower()}'
            self.add_item_to_export_safe(f'{second_level1}/all-counties', item)        # /us/dc/all-counties.json
            self.add_item_to_export_safe(f'{second_level1}/{fips}', item)              # /us/dc/11001.json
            self.add_item_to_export_safe(f'{top_level}/all-counties', item)            # /us/all-counties.json
            second_level2 = f'{top_level}/{fips[0:2]}'
            self.add_item_to_export_safe(f'{second_level2}/all-counties', item)        # /us/11/all-counties.json
            self.add_item_to_export_safe(f'{second_level2}/{fips}', item)              # /us/11/11001.json
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

    def _save_table_data_to_static_files(self, day, output_dir):
        log.debug('Save data into the files...')
        days = [day.strftime('%Y%m%d')]
        if self.is_latest:
            days.append('latest')
        items = self.items_for_export
        for fname in items:
            for day_str in days:
                if fname is not None:
                    self._save_to_json(output_dir / day_str / f'{fname}.json', items[fname])
                    self._save_to_csv(output_dir / day_str / f'{fname}.csv', items[fname])
                else:
                    self._save_to_json(output_dir / f'{day_str}.json', items[fname])
                    self._save_to_csv(output_dir / f'{day_str}.csv', items[fname])
