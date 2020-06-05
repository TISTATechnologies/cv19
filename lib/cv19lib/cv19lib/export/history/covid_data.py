from cv19lib.utils import logger
from cv19lib.utils.helper import DateTimeHelper, DatabaseContext
from ..base import Exporter

log = logger.get_logger(__file__)

class ValidationData:
    def __init__(self):
        pass

    def validate_ordered_data(self, key, location, items):
        log.debug(f'Validating {key} data for {location}: {len(items)} items...')

        log.info(f'Validate {key} data for {location} complete.')


class HistoryData(Exporter):
    PERIODS_DAYS = [2, 7, 30, 60, 90]

    def __init__(self, output_dir):
        super().__init__(output_dir / 'history')
        self.name = ' historical covid data'
        self.validator = ValidationData()

    def _calculate_past_data(self, key, location, items):
        log.info(f'Calculating past "{key}" data for {location} ({HistoryData.PERIODS_DAYS} days)...')
        for days in HistoryData.PERIODS_DAYS:
            log.debug(f'[{location}] past "{key}" data {days} days period...')
            for idx, item in enumerate(items or []):
                log.debug(f'[{location}:{idx:04}] past "{key}" data for {item["date"]} = {item["value"]}')
                prev_val = items[idx - days]['value'] if idx >= days else None
                delta_val = self.calculate_delta(item['value'], prev_val)
                if delta_val:
                    item[f'delta{days}'] = delta_val
                trend_val = self.calculate_trend(item['value'], prev_val)
                if trend_val:
                    item[f'trend{days}'] = trend_val
            log.debug(f'[{location}] past "{key}" data {days} days period complete')
        log.info(f'Calculate past "{key}" data for {location} complete')

    def _save_values(self, location, values):
        for key in values or {}:
            items = values[key] or []
            self.validator.validate_ordered_data(key, location, items)
            self._calculate_past_data(key, location, items)
            log.info(f'Save {len(items)} {key} cases for {location}')
            data = {'country_id': location.country_id}
            if location.state_id:
                data['state_id'] = location.state_id
            if location.fips:
                data['fips'] = location.fips
            data[key] = sorted(items, key=lambda x: x['date'], reverse=True)
            self.save_loc_data_to_file(key, location, data)

    def load_grouped_data(self, day):
        """ Load data on the specific date and group it by location (country_id-state_id-fips)
        """
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            prev_loc = None
            sql = ('country_id, state_id, fips, confirmed, deaths, recovered, active, date, datetime '
                   'FROM covid_data_stat ORDER BY fips, state_id, country_id, date;')
            log.info(f'Load all historical data')
            values = None
            for (country_id, state_id, fips, confirmed, deaths, recovered, active, date, _) in db.select(sql):
                cur_loc = self.get_location(country_id, state_id, fips)
                if prev_loc is None:
                    prev_loc = cur_loc
                if cur_loc != prev_loc:
                    self._save_values(prev_loc, values)
                    values = None
                    prev_loc = cur_loc
                    log.info(f'Processing {cur_loc}...')

                if values is None:
                    # values = {'confirmed': [], 'deaths': [], 'active': [], 'recovered': []}
                    values = {'active': []}
                date_str = DateTimeHelper.date_string(date)
                log.debug(f'Processing {cur_loc} on {date_str}...')
                # For today we need an 'active' cases only,
                # disable other cases types to decrease files size
                # values['confirmed'].append({'date': date_str, 'value': confirmed})
                # values['deaths'].append({'date': date_str, 'value': deaths})
                # values['recovered'].append({'date': date_str, 'value': recovered})
                values['active'].append({'date': date_str, 'value': active})
            self._save_values(prev_loc, values)
            values = None
            log.info(f'Load all historical data complete.')
