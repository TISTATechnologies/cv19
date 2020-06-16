import json
import hashlib
from cv19srv.utils import logger
from cv19srv.utils.helper import DownladHelper

log = logger.get_logger('base-collector')


class Collector:
    """ Base abstract class to declare Collector service
    """
    def __init__(self, source_id=None):
        self.name = 'base'
        self.source_id = source_id or 0
        self.counter_items_added = 0
        self.counter_items_duplicate = 0
        self.counter_items_failed = 0
        self.counter_items_notfound = 0

    def pull_data_by_day(self, day):
        raise NotImplementedError()

    def run(self, day, args=None):
        log.info(f'[{self.name}] Start collect data: {day}, {args}')
        self.pull_data_by_day(day)
        log.info(f'[{self.name}] End collect data: {day}, {args}')

    def load_json_data(self, url):
        content = DownladHelper.read_content(url)
        log.debug(f'Convert content to json')
        parsed_data = json.loads(content)
        if 'error' in parsed_data and bool(parsed_data.get('error', False)):
            log.error(f'ERROR: {parsed_data}')
            return None
        return [parsed_data] if not isinstance(parsed_data, list) else parsed_data

    def get_unique_key(self, values):
        values_str = ''.join([f'{v}' for v in values or []])
        return f'{self.source_id:04o}' + hashlib.md5(values_str.encode()).hexdigest()

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

    def save_covid_data_item(self, db, idx, country_id, state_id, fips,
                             confirmed, deaths, recovered, active,
                             geo_lat, geo_long, source_location, last_update,
                             unique_key, collected_time):
        sql = ''.join([
            'covid_data ',
            '(source_id, country_id, state_id, fips, confirmed, deaths, recovered, active, ',
            'geo_lat, geo_long, source_location, source_updated, unique_key, datetime) ',
            'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);'])
        values = (self.source_id, country_id, state_id, fips,
                  confirmed, deaths, recovered, active,
                  geo_lat, geo_long, source_location, last_update, unique_key, collected_time)
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
