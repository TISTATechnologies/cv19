# pylint: disable=R0801
import datetime
from pathlib import Path
from cv19srv.utils import logger
from cv19srv.utils.helper import DateTimeHelper, DatabaseContext
from .base import DataType, Exporter, Location

log = logger.get_logger('history')


class HistoryData(Exporter):

    def __init__(self, output_dir: Path):
        super().__init__('historical covid data', output_dir / 'history')
        self.trend_periods = self.get_trend_periods()

    def _validate_ordered_data(self, data_group: DataType, location: Location, items: list) -> None:
        # log.debug(f'Validating {data_group} data for {location}: {len(items)} items...')
        # TODO: add a logic to validate historical data
        # log.info(f'Validate {data_group} data for {location} complete.')
        pass

    def _calculate_past_data(self, data_group: DataType, location: Location, items: list) -> None:
        """ Calculate delta and trend value for each of the datatype
        """
        log.debug(f'Calculating past "{data_group}" data for {location} ({self.trend_periods} days)...')
        for days in self.trend_periods:
            log.debug(f'[{location}] past "{data_group}" data {days} days period...')
            for idx, item in enumerate(items or []):
                log.debug(f'[{location}:{idx:04}] past "{data_group}" data for {item["date"]} = {item["value"]}')
                prev_val = items[idx - days]['value'] if idx >= days else None
                delta_val = self.calculate_delta(item['value'], prev_val)
                if delta_val:
                    item[f'delta{days}'] = delta_val
                trend_val = self.calculate_trend(item['value'], prev_val)
                if trend_val:
                    item[f'trend{days}'] = trend_val
            log.debug(f'[{location}] past "{data_group}" data {days} days period complete')
        log.debug(f'Calculate past "{data_group}" data for {location} complete')

    def _save_grouped_values(self, location: Location, grouped_values: dict) -> None:
        """ Save all items wich are grouped by datetype
        """
        data = {'country_id': location.country_id}
        if location.state_id:
            data['state_id'] = location.state_id
        if location.fips:
            data['fips'] = location.fips
        for data_group in grouped_values or {}:
            items = grouped_values[data_group] or []
            self._validate_ordered_data(data_group, location, items)
            if data_group in (DataType.CONFIRMED, DataType.DEATHS, DataType.ACTIVE, DataType.RECOVERED):
                self._calculate_past_data(data_group, location, items)
            log.debug(f'Save {len(items)} {data_group} cases for {location}')
            data[data_group.value] = sorted(items, key=lambda x: x['date'], reverse=True)
        self.save_loc_data_to_file(None, location, data)

    def load_grouped_data(self, day: datetime.datetime) -> None:
        """ Load data on the specific date and group it by location (country_id-state_id-fips)
        """
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            prev_loc = None
            sql = ('country_id, state_id, fips, confirmed, deaths, recovered, active, date, datetime, '
                   'hospitalized_currently, hospitalized_cumulative, '
                   'vaccination_distributed, vaccination_administered, vaccination_adm_dose1, vaccination_adm_dose2 '
                   'FROM covid_data_stat ORDER BY fips, state_id, country_id, date;')
            log.info(f'Load all historical data')
            grouped_values = None
            for (country_id, state_id, fips, confirmed, deaths, recovered, active, date, _,
                 hospitalized_currently, hospitalized_cumulative,
                 vaccination_distributed, vaccination_administered,
                 vaccination_adm_dose1, vaccination_adm_dose2) in db.select(sql):
                cur_loc = self.get_location(country_id, state_id, fips)
                if prev_loc is None:
                    prev_loc = cur_loc
                if cur_loc != prev_loc:
                    self._save_grouped_values(prev_loc, grouped_values)
                    grouped_values = None
                    prev_loc = cur_loc
                    log.debug(f'Processing {cur_loc}: {confirmed}, {deaths}, {recovered}, {active}...')

                if grouped_values is None:
                    grouped_values = {DataType.ACTIVE: [], DataType.HOSPITALIZED: [], DataType.VACCINATION: []}
                date_str = DateTimeHelper.date_string(date)
                log.debug(f'Processing {cur_loc} on {date_str}...')
                # For today we need an 'active' cases only,
                # disable other cases types to decrease files size
                # grouped_values['confirmed'].append({'date': date_str, 'value': confirmed})
                # grouped_values['deaths'].append({'date': date_str, 'value': deaths})
                # grouped_values['recovered'].append({'date': date_str, 'value': recovered})
                grouped_values[DataType.ACTIVE].append({'date': date_str, 'value': active})
                if hospitalized_currently or hospitalized_cumulative:
                    grouped_values[DataType.HOSPITALIZED].append(
                        {'date': date_str, 'currently': hospitalized_currently,
                         'cumulative': hospitalized_cumulative})
                if vaccination_distributed or vaccination_administered \
                   or vaccination_adm_dose1 or vaccination_adm_dose2:
                    grouped_values[DataType.VACCINATION].append(
                        {'date': date_str, 'distributed': vaccination_distributed,
                         'administered': vaccination_administered,
                         'adm_dose1': vaccination_adm_dose1, 'adm_dose2': vaccination_adm_dose2})
            self._save_grouped_values(prev_loc, grouped_values)
            grouped_values = None
            log.info(f'Load all historical data complete.')


def run(day, output_dir) -> bool:
    HistoryData(output_dir).run(day)
    return True
