import datetime
import json
from typing import List
from cv19srv.utils import logger
from cv19srv.utils.helper import DatabaseContext, DateTimeHelper, DownloadHelper
from .models import CovidDataItem, RawDataItem

log = logger.get_logger('base-collector')


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
        if self._save_covid_data_items(db, idx, [item]) and item.source_id != CovidDataItem.SOURCE_COMBINED:
            combined_item = item.clone()
            combined_item.source_id = CovidDataItem.SOURCE_COMBINED
            combined_item.source_updated = DateTimeHelper.now()
            self._save_covid_data_items(db, idx, [combined_item])

    def save_covid_data_items(self, db: DatabaseContext, items: list) -> None:
        if self._save_covid_data_items(db, len(items or []), items):
            combined_items = [x.clone() for x in items if x.source_id != CovidDataItem.SOURCE_COMBINED]
            for item in combined_items:
                item.source_id = CovidDataItem.SOURCE_COMBINED
            if combined_items:
                self._save_covid_data_items(db, len(combined_items), combined_items)

    def _process_db_exception(self, ex, suppress_exceptions):
        err_message = str(ex)
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

    def _save_covid_data_items(self, db: DatabaseContext, idx: int, items: List[CovidDataItem],
                               suppress_exceptions: bool = False) -> bool:
        try:
            items_len = len(items or [])
            if items_len == 0 or not items[0]:
                log.warning('The items is None or empty. Skip saving.')
                return False
            item_keys = items[0].keys()
            fields = ','.join(item_keys)
            placeholder = ','.join(['%s'] * len(item_keys))
            values = None
            if items_len == 1:
                item = items[0]
                item_unique_key = item.get_unique_key()
                log.debug(f'Saving item into the database: {items}')
                exists = db.select(f'{fields},id FROM covid_data where unique_key = %s;', [item_unique_key])
                if exists:
                    item_db = exists[0]
                    item_id = item_db[-1]
                    log.debug(f'Update existed item [id={item_id}] - merged: {item.values()}')
                    item_updated = CovidDataItem.from_db_item(item_db).merge(item)
                    fields_sql = ','.join([f'{key}=%s' for key in item_keys])
                    sql = f'UPDATE covid_data SET {fields_sql},updated=%s WHERE id = {item_id};'
                    values = item_updated.values()
                    values.append(DateTimeHelper.now())
                    db.execute(sql, values)
                else:
                    log.debug(f'Insert new item: {values}')
                    values = item.values()
                    sql = f'covid_data ({fields}) VALUES ({placeholder});'
                    db.insert(sql, values)
            else:
                log.debug(f'Bulk insert {items_len} items.')
                bulk_insert_placeholders = ','.join([f'({placeholder})'] * items_len)
                values = [v for item in items for v in item.values()]
                sql = f'covid_data ({fields}) VALUES {bulk_insert_placeholders};'
                db.insert(sql, values)
            log.debug(f'Item={idx:05}: Success insert item into the database: {values}')
            db.commit()
            self.counter_items_added += items_len
            return True
        except Exception as ex:
            db.rollback()
            self._process_db_exception(ex, suppress_exceptions)
            return False

    def insert_into_db(self, db: DatabaseContext, idx: int, sql: str, values: List[CovidDataItem],
                       suppress_exceptions: bool = False) -> None:
        try:
            if not values:
                log.debug(f'The items list is empty. Skip insert values.')
            else:
                log.debug(f'Insert item into the database: {values}')
                db.insert(sql, values)
                log.debug(f'Item={idx:05}: Success insert item into the database: {values}')
                db.commit()
                self.counter_items_added += len(values)
        except Exception as ex:
            db.rollback()
            self._process_db_exception(ex, suppress_exceptions)
