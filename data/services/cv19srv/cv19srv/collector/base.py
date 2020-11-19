import json
import hashlib
from decimal import Decimal
from cv19srv.utils import logger
from cv19srv.utils.helper import Converter, DownloadHelper, JsonHelper

log = logger.get_logger('base-collector')


class CovidDataItem:
    def __init__(self, source_id, country_id, state_id, fips, collected_datetime,
                 confirmed, deaths, recovered, active, source_location, source_updated, geo_lat, geo_long):
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

    def _get_unique_key_by_values(self, values):
        values_str = ''.join([f'{v}' for v in values or []])
        return f'{self.source_id:04o}' + hashlib.md5(values_str.encode()).hexdigest()

    def get_unique_key(self):
        return self._get_unique_key_by_values([self.country_id, self.state_id, self.fips, self.datetime])

    def __str__(self):
        items = self.__dict__
        items['unique_key'] = self.get_unique_key()
        return JsonHelper.serialize(items)


class RawDataItem:
    def __init__(self, raw_row, idx=None):
        self.values = raw_row or []
        self.idx = idx
        self.length = len(self.values)

    def _is_key_number(self, key):
        if key is not None and isinstance(key, int) or key.isnumeric():
            return True
        return False

    def __contains__(self, key):
        if self._is_key_number(key):
            return int(key) < len(self.values)
        return key in self.values

    def get(self, key, default=None):
        if key not in self:
            return default
        if self._is_key_number(key):
            return self.values[int(key)] or default
        return self.values.get(key) or default

    def get_int(self, key, default=None):
        return int(float(self.get(key, default)))

    def get_decimal(self, key, default=None):
        return Decimal(self.get(key, default))

    def get_datetime(self, key, default=None):
        return Converter.parse_datetime(self.get(key, default))

    def get_fips(self, key):
        val = self.get(key, None)
        return Converter.to_real_fips(val) if val else None


class Collector:
    """ Base abstract class to declare Collector service
    """
    def __init__(self, name, source_id=None):
        self.name = name or 'base'
        self.source_id = source_id or 0
        self.counter_items_added = 0
        self.counter_items_duplicate = 0
        self.counter_items_failed = 0
        self.counter_items_notfound = 0
        self.download_helper = DownloadHelper()

    def pull_data_by_day(self, day):
        raise NotImplementedError()

    def run(self, day, args=None):
        log.info(f'[{self.name}] Start collect data: {day}, {args}')
        self.pull_data_by_day(day)
        log.info(f'[{self.name}] End collect data: {day}, {args}')

    def load_json_data(self, url):
        content = self.download_helper.read_content(url)
        log.debug(f'Convert content to json')
        parsed_data = json.loads(content)
        if 'error' in parsed_data and bool(parsed_data.get('error', False)):
            log.error(f'ERROR: {parsed_data}')
            return None
        return [parsed_data] if not isinstance(parsed_data, list) else parsed_data

    def start_pulling(self, db, day):
        db.log_message(f'{self.name}: Start pull information - day={day}')
        db.references.load_all()

    def end_pulling(self, db, day, row_counter):
        message = (f'Processed {row_counter} items - day={day}: added={self.counter_items_added}, '
                   f'duplicate={self.counter_items_duplicate}, failed={self.counter_items_failed}, '
                   f'not-found={self.counter_items_notfound}')
        log.info(message)
        db.log_message(f'{self.name}: {message}')
        self.counter_items_added = 0
        self.counter_items_duplicate = 0
        self.counter_items_failed = 0
        self.counter_items_notfound = 0

    def save_covid_data_item(self, db, idx: int, item: CovidDataItem):
        sql = ''.join([
            'covid_data ',
            '(source_id, country_id, state_id, fips, confirmed, deaths, recovered, active, ',
            'geo_lat, geo_long, source_location, source_updated, unique_key, datetime) ',
            'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);'])
        values = (item.source_id, item.country_id, item.state_id, item.fips,
                  item.confirmed, item.deaths, item.recovered, item.active,
                  item.geo_lat, item.geo_long, item.source_location,
                  item.source_updated, item.get_unique_key(), item.datetime)
        self.insert_into_db(db, idx, sql, values, False)

    def insert_into_db(self, db, idx, sql, values, suppress_exceptions=False):
        try:
            log.debug(f'Insert item into the database: {values}')
            db.insert(sql, values)
            log.info(f'Item={idx:05}: Success insert item into the database: {values}')
            db.commit()
            self.counter_items_added += 1
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
