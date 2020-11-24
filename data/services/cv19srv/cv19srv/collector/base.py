import datetime
import json
import hashlib
from decimal import Decimal
from typing import Any, Union
from cv19srv.utils import logger
from cv19srv.utils.helper import Converter, DatabaseContext, DownloadHelper, JsonHelper

log = logger.get_logger('base-collector')


class CovidDataItem:
    def __init__(self, source_id, country_id, state_id, fips, collected_datetime,
                 confirmed, deaths, recovered, active, source_location, source_updated, geo_lat, geo_long,
                 hospitalized_currently, hospitalized_cumulative,
                 in_icu_currently, in_icu_cumulative,
                 on_ventilator_currently, on_ventilator_cumulative):
        self.source_id = source_id
        self.country_id = country_id
        self.state_id = state_id
        self.fips = fips
        self.datetime = collected_datetime
        self.confirmed = confirmed
        self.deaths = deaths
        self.recovered = recovered
        self.active = active
        self.source_location = source_location
        self.source_updated = source_updated
        self.geo_lat = geo_lat
        self.geo_long = geo_long
        self.hospitalized_currently = hospitalized_currently
        self.hospitalized_cumulative = hospitalized_cumulative
        self.in_icu_currently = in_icu_currently
        self.in_icu_cumulative = in_icu_cumulative
        self.on_ventilator_currently = on_ventilator_currently
        self.on_ventilator_cumulative = on_ventilator_cumulative

    @property
    def active_calculated(self):
        if self.confirmed is not None and self.deaths is not None and self.recovered is not None:
            return self.confirmed - self.deaths - self.recovered
        return None

    def get_unique_key(self) -> str:
        """ Calculate unique key for the covid data related to the datetime, location, and source
        """
        values_str = f'{self.country_id}{self.state_id}{self.fips}{self.datetime}'
        return f'{self.source_id:04o}' + hashlib.md5(values_str.encode()).hexdigest()

    def __str__(self) -> str:
        items = self.__dict__
        items['unique_key'] = self.get_unique_key()
        return JsonHelper.serialize(items)


class RawDataItem:
    """ Helper class to wrap all raw data items from the data sources
    """
    def __init__(self, raw_row: list, idx: int = None):
        self.values = raw_row or []
        self.idx = idx
        self.length = len(self.values)

    def _is_key_number(self, key: Union[int, str]) -> bool:
        if key is not None and isinstance(key, int) or key.isnumeric():
            return True
        return False

    def __contains__(self, key: Union[int, str]) -> bool:
        if self._is_key_number(key):
            return int(key) < len(self.values)
        return key in self.values

    def get(self, key: Union[int, str], default: Any = None) -> Any:
        if key not in self:
            return default
        if self._is_key_number(key):
            return self.values[int(key)] or default
        return self.values.get(key) or default

    def get_int(self, key: Union[int, str], default=None) -> int:
        val = self.get(key, default)
        return int(float(val)) if val is not None else None

    def get_decimal(self, key: Union[int, str], default=None) -> Decimal:
        val = self.get(key, default)
        return Decimal(val) if val is not None else None

    def get_datetime(self, key: Union[int, str], default=None) -> datetime.datetime:
        val = self.get(key, default)
        if isinstance(val, datetime.datetime):
            return val
        return Converter.parse_datetime(val)

    def get_fips(self, key: Union[int, str]) -> str:
        val = self.get(key, None)
        return Converter.to_real_fips(val) if val else None


class Collector:
    """ Base abstract class to declare Collector service
    """
    def __init__(self, name: str, source_id: int = None):
        self.name = name or 'base'
        self.source_id = source_id or 0
        self.counter_items_added = 0
        self.counter_items_duplicate = 0
        self.counter_items_failed = 0
        self.counter_items_notfound = 0
        self.download_helper = DownloadHelper()

    def pull_data_by_day(self, day: datetime.datetime) -> None:
        raise NotImplementedError()

    def run(self, day: datetime.datetime, args: list = None) -> None:
        log.info(f'[{self.name}] Start collect data: {day}, {args}')
        self.pull_data_by_day(day)
        log.info(f'[{self.name}] End collect data: {day}, {args}')

    def load_json_data(self, url: str) -> list:
        content = self.download_helper.read_content(url)
        log.debug(f'Convert content to json')
        parsed_data = json.loads(content)
        if 'error' in parsed_data and bool(parsed_data.get('error', False)):
            log.error(f'ERROR: {parsed_data}')
            return None
        return [parsed_data] if not isinstance(parsed_data, list) else parsed_data

    def start_pulling(self, db: DatabaseContext, day: datetime.datetime) -> None:
        db.log_message(f'{self.name}: Start pull information - day={day}')
        db.references.load_all()

    def end_pulling(self, db: DatabaseContext, day: datetime.datetime, row_counter: int) -> None:
        message = (f'Processed {row_counter} items - day={day}: added={self.counter_items_added}, '
                   f'duplicate={self.counter_items_duplicate}, failed={self.counter_items_failed}, '
                   f'not-found={self.counter_items_notfound}')
        log.info(message)
        db.log_message(f'{self.name}: {message}')
        self.counter_items_added = 0
        self.counter_items_duplicate = 0
        self.counter_items_failed = 0
        self.counter_items_notfound = 0

    def save_covid_data_item(self, db: DatabaseContext, idx: int, item: CovidDataItem) -> None:
        sql = ''.join([
            'covid_data ',
            '(source_id, country_id, state_id, fips, confirmed, deaths, recovered, active, ',
            'geo_lat, geo_long, source_location, source_updated, unique_key, datetime, ',
            'hospitalized_currently, hospitalized_cumulative, in_icu_currently, in_icu_cumulative, ',
            'on_ventilator_currently, on_ventilator_cumulative'
            ') ',
            'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);'])
        values = (item.source_id, item.country_id, item.state_id, item.fips,
                  item.confirmed, item.deaths, item.recovered, item.active,
                  item.geo_lat, item.geo_long, item.source_location,
                  item.source_updated, item.get_unique_key(), item.datetime,
                  item.hospitalized_currently, item.hospitalized_cumulative,
                  item.in_icu_currently, item.in_icu_cumulative,
                  item.on_ventilator_currently, item.on_ventilator_cumulative)
        self.insert_into_db(db, idx, sql, values, False)

    def save_covid_data_items(self, db: DatabaseContext, items: list) -> None:
        if not items:
            log.warning('The items list is empty. Skip bulk insert.')
            return
        items_len = len(items)
        log.debug(f'Bulk insert {items_len} items.')
        values_placeholders = ','.join(['(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'] * items_len)
        sql = ''.join([
            'covid_data ',
            '(source_id, country_id, state_id, fips, confirmed, deaths, recovered, active, ',
            'geo_lat, geo_long, source_location, source_updated, unique_key, datetime, ',
            'hospitalized_currently, hospitalized_cumulative, in_icu_currently, in_icu_cumulative, ',
            'on_ventilator_currently, on_ventilator_cumulative',
            ') ',
            f'VALUES {values_placeholders};'])
        values = []
        for item in items:
            values.append(item.source_id)
            values.append(item.country_id)
            values.append(item.state_id)
            values.append(item.fips)
            values.append(item.confirmed)
            values.append(item.deaths)
            values.append(item.recovered)
            values.append(item.active)
            values.append(item.geo_lat)
            values.append(item.geo_long)
            values.append(item.source_location)
            values.append(item.source_updated)
            values.append(item.get_unique_key())
            values.append(item.datetime)
            values.append(item.hospitalized_currently)
            values.append(item.hospitalized_cumulative)
            values.append(item.in_icu_currently)
            values.append(item.in_icu_cumulative)
            values.append(item.on_ventilator_currently)
            values.append(item.on_ventilator_cumulative)
        self.insert_into_db(db, items_len, sql, values, False, items_len)

    def insert_into_db(self, db: DatabaseContext, idx: int, sql: str, values: list,
                       suppress_exceptions: bool = False, value_count: int = 1) -> None:
        try:
            log.debug(f'Insert item into the database: {values}')
            db.insert(sql, values)
            log.debug(f'Item={idx:05}: Success insert item into the database: {values}')
            db.commit()
            self.counter_items_added += value_count
        except Exception as ex:
            err_message = str(ex)
            db.rollback()
            if 'covid_data_unique_key_key' in err_message or 'duplicate key value' in err_message:
                self.counter_items_duplicate += 1
                log.warning(err_message.rstrip().replace('\nDETAIL', ', DETAIL'))
            elif 'column "country_id" violates not-null constraint' in err_message:
                self.counter_items_notfound += 1
                log.warning(err_message.rstrip().replace('\nDETAIL', ', DETAIL'))
            else:
                self.counter_items_failed += 1
                if suppress_exceptions:
                    log.error(ex)
                else:
                    raise ex
