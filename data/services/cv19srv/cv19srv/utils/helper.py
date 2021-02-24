#!/usr/bin/env python3
import csv
import datetime
import hashlib
import json
import os
import sys
import time
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
import requests

from . import logger
from ..config import config


__all__ = ['DownloadHelper', 'CsvHelper', 'JsonHelper', 'Converter', 'DatabaseContext', 'trace']
log = logger.get_logger(__name__)


def trace(message):
    sys.stderr.write(f'{message}{os.linesep}')


class DateTimeHelper:
    @staticmethod
    def get_yesterday_date():
        return DateTimeHelper.add_days(DateTimeHelper.get_today_date(), -1)

    @staticmethod
    def add_days(date, days=0):
        return (date or DateTimeHelper.get_today_date()) + datetime.timedelta(days=days)

    @staticmethod
    def get_today_date():
        return datetime.date.today()

    @staticmethod
    def now():
        return datetime.datetime.utcnow()

    @staticmethod
    def get_end_day(day):
        return datetime.datetime(day.year, day.month, day.day, 23, 59, 59)

    @staticmethod
    def parse_date(datetime_str=None):
        if not datetime_str or datetime_str in ['latest', 'yesterday']:
            return DateTimeHelper.get_yesterday_date()
        return Converter.parse_date(datetime_str)

    @staticmethod
    def datetime_string(dt, fmt='%Y-%m-%dT%H:%M:%S%z'):
        return dt.strftime(fmt) if dt else None

    @staticmethod
    def date_string(dt, fmt='%Y-%m-%d'):
        return dt.strftime(fmt) if dt else None


class DownloadHelper:
    def __init__(self):
        if 'CACHE_DIR' in os.environ:
            if os.environ.get('CACHE_DIR').lower() in ['none', 'no', 'disabled']:
                self.cache_dir = None
            else:
                self.cache_dir = Path(os.environ.get('CACHE_DIR'))
        else:
            self.cache_dir = (Path.home() / '.cache' / 'cv19')
        log.debug(f'Cache directory: {self.cache_dir}')

    def url_to_cache_file(self, data_url: str, data_size: int = None) -> Path:
        uri = urlparse(data_url)
        parts = [uri.hostname]
        parts.extend(uri.path.split('/'))
        if uri.query:
            query_hash = hashlib.sha1(uri.query.encode('utf-8')).hexdigest()
            # If we are worried about a collision use a whole query_hash instead of the short version
            parts[-1] = parts[-1] + '-' + query_hash[:6] + query_hash[-6:]
        if (data_size or 0) > 0:
            name, ext = os.path.splitext(parts[-1])
            parts[-1] = name + '.' + str(data_size) + ext
        return os.path.sep.join(parts)

    def download_file(self, url: str, output_file: Path, overwrite=False):
        log.info(f'Downloading {url}....')
        if output_file.exists() and not overwrite:
            log.info(f'File {output_file} exists. Skip download.')
        else:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            log.debug(f'Output file is {output_file}.')
            data = self.read_content(url)
            output_file.write_bytes(data)
            log.debug(f'Downloaded into the {output_file} file.')

    def read_content(self, url: str, cache_enabled: bool = True):
        log.info(f'Read text from {url}....')
        req = requests.get(url, allow_redirects=True, stream=True)
        res_size = int(req.headers.get('Content-length') or 0)
        log.debug(f'Get the response size: {res_size}')
        data = None
        if cache_enabled and self.cache_dir:
            cache_file_path = self.cache_dir / 'data' / self.url_to_cache_file(url, res_size)
            log.debug(f'Cache file: {cache_file_path}')
            if cache_file_path.exists():
                log.debug(f'Cache file exists - read cached data')
                data = cache_file_path.read_bytes()
            else:
                log.debug(f'Cache file not exists - read response and save cache')
                data = req.content
                cache_file_path.parent.mkdir(parents=True, exist_ok=True)
                cache_file_path.write_bytes(data)
        else:
            log.debug(f'Read response')
            data = req.content
        log.debug(f'Read text from {url} - complete')
        return data


class ExcelHelper:
    def __init__(self):
        import pandas                           # pylint: disable=C0415, E0401
        self.pandas = pandas

    def read_table_from_url(self, excel_file_url, sheet_name=0, columns=None):
        log.debug(f'Download file from {excel_file_url}')
        data = self.pandas.read_excel(excel_file_url, sheet_name=sheet_name, usecols=columns)
        log.debug(f'Reading data line by line (Sheetname={sheet_name}, Columns={columns}')
        for row in data.to_numpy():
            yield row.tolist()


class CsvHelper:
    def __init__(self):
        self.tmp = config.temp_dir
        self.download_helper = DownloadHelper()
        log.debug(f'Temp directory {self.tmp}')

    def _read_file_stream(self, csv_file_stream, delimiter=',', quotechar='"'):
        reader = csv.reader(csv_file_stream, delimiter=delimiter, quotechar=quotechar)
        for row in reader:
            yield row

    def read_stdin(self, delimiter=',', quotechar='"'):
        log.debug('Read CSV data from STDIN')
        yield from self._read_file_stream(sys.stdin, delimiter, quotechar)

    def read_csv_file(self, file_name: Path, delimiter=',', quotechar='"'):
        with open(file_name, newline='') as csvfile:
            log.debug(f'Read {file_name} file line by line')
            yield from self._read_file_stream(csvfile, delimiter, quotechar)

    def read_url(self, url: str, overwrite=False, delimiter=',', quotechar='"'):
        log.debug(f'Download file from {url}')
        tmp_name = url.rsplit('/', 1)[1] if url.find('/') else f'{int(time.time())}.csv'
        tmp_file = self.tmp / tmp_name
        log.debug(f'Temporary file {tmp_file}')
        self.download_helper.download_file(url, tmp_file, overwrite)
        yield from self.read_csv_file(tmp_file, delimiter, quotechar)

    def write_csv_file(self, file_name: Path, header, items, delimiter=',', quotechar='"'):
        file_name.parent.mkdir(parents=True, exist_ok=True)
        with file_name.open('w') as fo:
            csv_writer = csv.writer(fo, delimiter=delimiter, quotechar=quotechar, quoting=csv.QUOTE_MINIMAL)
            if header:
                csv_writer.writerow(header)
            for item in items or []:
                csv_writer.writerow(item)

    @staticmethod
    def save_list(output_file: Path, items: list):
        csv_helper = CsvHelper()
        data_for_csv = items or []
        data_len = len(data_for_csv)
        log.debug(f'Saving {data_len} items into the file {output_file}...')
        header = data_for_csv[0].keys() if len(data_for_csv) > 0 else []
        values = [item.values() for item in data_for_csv]
        csv_helper.write_csv_file(output_file, header, values)
        log.info(f'Save {data_len} items into the file {output_file}')


class MathHelper:
    @staticmethod
    def sum(*numbers):
        res = 0
        for num in (numbers or []):
            if num is None:
                return None
            res += int(num)
        return res


class Converter:
    @staticmethod
    def parse_datetime(value):
        if value is None:
            return None
        if 'T24:' in value:
            value = value.replace('T24:', 'T00:')
        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S%z',
                    '%Y-%m-%dT%H:%M:%S', '%m/%d/%Y %H:%M',
                    '%m/%d/%y %H:%M', '%m/%d/%Y %H:%M:%S']:
            try:
                return datetime.datetime.strptime(value, fmt)
            except ValueError:
                pass
        raise ValueError(f'Incorrect datetime format: {value}')

    @staticmethod
    def parse_date(value):
        if value is None:
            return None
        for fmt in ['%Y-%m-%d', '%Y%m%d', '%m/%d/%y', '%m/%d/%Y']:
            try:
                return datetime.datetime.strptime(value, fmt).date()
            except ValueError:
                pass
        raise ValueError(f'Incorrect date format: {value}')

    @staticmethod
    def to_string(value):
        if value is None:
            return ''
        if isinstance(value, Decimal):
            return f'{value:.4f}'
        if isinstance(value, datetime.datetime):
            return DateTimeHelper.datetime_string(value)
        return str(value)

    @staticmethod
    def to_fips(value):
        if value is None or value == '':
            return None
        return str(value).rjust(5, '0')

    @staticmethod
    def to_real_fips(value):
        if value is None or value == '':
            return None
        return Converter.to_fips(int(float(value)))


class DatabaseContext:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.log_message = Log(self).put_message
        self.references = References(self)

    def insert(self, sql, values):
        self.execute('INSERT INTO ' + sql, values or [])
        return self.cursor.rowcount

    def select(self, sql, values=None):
        self.execute('SELECT ' + sql, values or [])
        return self.cursor.fetchall()

    def execute(self, sql, values=None):
        log.debug(f'sql: {sql},  values={values}')
        self.cursor.execute(sql, values or [])

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def _connect(self):
        if self.cursor:
            log.debug('Already connected')
            return self
        log.debug(f'Open database connection: {config.db_user}:*@{config.db_host}:{config.db_port} '
                  f'(schema={config.db_schema})')
        self.conn = psycopg2.connect(
            user=config.db_user, password=config.db_pass,
            host=config.db_host, port=config.db_port,
            database=config.db_name, options=(f'-c search_path={config.db_schema}' if config.db_schema else None))
        self.cursor = self.conn.cursor()
        return self

    def _close(self):
        try:
            self.cursor.close()
            self.conn.close()
            log.debug('Database connection was closed.')
        except (psycopg2.Error) as ex:
            log.error(f'Close connection error: {ex}')

    def __enter__(self):
        return self._connect()

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            log.error(f'Exception [{exc_type}]: {exc_val}. tb={exc_tb}')
        self._close()


class References:
    """ Additional class to store references from database: countries, states, custom areas and etc.
    """
    def __init__(self, database_context):
        self.database_context = database_context
        self.countries = {}
        self.states = {}
        self.areas = {}

    def load_all(self):
        for row in self.database_context.select('* FROM country;'):
            self.countries[row[0]] = {
                'name': row[1],
                'aliases': [v.strip().lower() for v in (row[2] or '').split(',')],
                'geo_lat': row[3],
                'geo_long': row[4]
            }

        for row in self.database_context.select('* FROM state;'):
            country_id = row[1]
            if country_id not in self.states:
                self.states[country_id] = {}
            self.states[country_id][row[0]] = {
                'name': row[2],
                'aliases': [v.strip().lower() for v in (row[4] or '').split(',')],
                'fips': row[5],
                'type': row[3],
                'use_in_summary': row[3] in ('state', 'federal district')
            }

        for row in self.database_context.select('* FROM region_part_details;'):
            (country_id, state_id, fips, area_type, area_id, name, geo_lat, geo_long, _, _) = row
            key = f'{country_id}-{state_id}-{fips}'
            if key not in self.areas:
                self.areas[key] = []
            self.areas[key].append({
                'country_id': country_id,
                'state_id': state_id,
                'fips': fips,
                'area_type': area_type,
                'area_id': area_id,
                'name': name,
                'geo_lat': geo_lat,
                'geo_long': geo_long
            })

    def find_country_id(self, country_name):
        if not country_name:
            return None
        if country_name in self.countries:
            return country_name
        filter_name = country_name.lower() \
            .replace(',', ' ').replace('*', ' ') \
            .replace('  ', ' ').strip()
        for (key, fields) in self.countries.items():
            name = (fields['name'] or '').lower()
            aliases = fields['aliases']
            if key.upper() == country_name.upper() or name == filter_name \
               or filter_name in aliases:
                return key
        return None

    def find_state_id(self, country_id, state_name):
        if not state_name or not country_id:
            return None
        filter_name = state_name.lower() \
            .replace(',', ' ').replace('*', ' ') \
            .replace('  ', ' ').strip()
        country_states = self.states.get(country_id, {})

        for (key, fields) in country_states.items():
            name = (fields['name'] or '').lower()
            aliases = fields['aliases']
            if not key:
                continue
            if key.upper() == filter_name.upper() or name == filter_name or filter_name in aliases:
                return key
        return None

    def find_state_fips(self, country_id, state_name):
        if state_name in ('US', 'USA'):
            return '00000'
        state_id = self.find_state_id(country_id, state_name)
        state = self.states[country_id].get(state_id)
        if state:
            return state['fips'].rjust(5, '0')
        return None


class JsonHelper:
    @staticmethod
    def _converter(obj):
        if isinstance(obj, Decimal):
            return f'{obj:.4f}'
        if isinstance(obj, datetime.datetime):
            return DateTimeHelper.datetime_string(obj)
        return obj

    @staticmethod
    def serialize(obj):
        return json.dumps(obj, default=JsonHelper._converter)

    @staticmethod
    def save_list(output_file: Path, items: list):
        output_file.parent.mkdir(parents=True, exist_ok=True)
        items_len = len(items or [])
        log.debug(f'Saving {items_len} items into the file {output_file}...')
        with output_file.open('w') as fo:
            json.dump(items or [], fo,
                      indent=None if config.minify else 2,
                      separators=(',', ':') if config.minify else None)
        log.info(f'Save {items_len} items into the file {output_file}')


class Log:
    def __init__(self, database_context):
        self.database_context = database_context

    def put_message(self, message):
        self.database_context.insert('_log(message) VALUES (%s)', [message])
        self.database_context.commit()
