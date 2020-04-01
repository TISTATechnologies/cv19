#!/usr/bin/env python3
import csv
import os
import psycopg2
import requests
import sys
import time
from pathlib import Path
from datetime import datetime

import lib.logger as logger
from lib.config import config


__all__ = ['DownladHelper', 'CsvHelper', 'Converter', 'DatabaseContext', 'trace']
log = logger.getLogger(__name__)


def trace(message):
    sys.stderr.write(f'{message}{os.linesep}')


class DownladHelper:
    @staticmethod
    def download_file(url: str, output_file: Path, overwrite=False):
        log.info(f'Downloading {url}....')
        if output_file.exists() and not overwrite:
            log.info(f'File {output_file} exists. Skip download.')
        else:
            log.debug(f'Output file is {output_file}.')
            r = requests.get(url, allow_redirects=True)
            open(output_file, 'wb').write(r.content)
            log.debug(f'Downloaded into the {output_file} file.')

    @staticmethod
    def read_content(url: str):
        log.info(f'Read text from {url}....')
        r = requests.get(url, allow_redirects=True)
        return r.content


class ExcelHelper:
    def __init__(self):
        import pandas
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
        log.debug(f'Temp directory {self.tmp}')

    def _read_file_stream(self, csv_file_stream, delimiter=',', quotechar='"'):
        reader = csv.reader(csv_file_stream, delimiter=delimiter, quotechar=quotechar)
        for row in reader:
            yield row

    def read_stdin(self, delimiter=',', quotechar='"'):
        log.debug(f'Read CSV data from STDIN')
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
        DownladHelper.download_file(url, tmp_file, overwrite)
        yield from self.read_csv_file(tmp_file, delimiter, quotechar)


class Converter:
    @staticmethod
    def parse_datetime(value):
        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S%z',
                    '%m/%d/%y %H:%M', '%m/%d/%Y %H:%M:%S']:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                pass
        raise ValueError(f'Incorrect datetime format: {value}')

    @staticmethod
    def parse_date(value):
        for fmt in ['%Y-%m-%d', '%Y%m%d', '%m/%d/%y', '%m/%d/%Y']:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                pass
        raise ValueError(f'Incorrect date format: {value}')


class DatabaseContext:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.log_message = Log(self).put_message
        self.references = References(self)

    def insert(self, sql, values):
        self.execute('INSERT INTO ' + sql, values)
        return self.cursor.rowcount

    def select(self, sql, values={}):
        self.execute('SELECT' + sql, values)
        return self.cursor.fetchall()

    def execute(self, sql, values):
        log.debug(f'sql: {sql},  values={values}')
        self.cursor.execute(sql, values)

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def _connect(self):
        if self.cursor:
            log.debug('Already connected')
            return self
        log.debug('Open database connection.')
        self.conn = psycopg2.connect(
            user=config.db_user, password=config.db_pass,
            host=config.db_host, port=config.db_port,
            database=config.db_name, options=f'-c search_path={config.db_schema}')
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
    def __init__(self, database_context):
        self.database_context = database_context
        self.countries = {}
        self.states = {}

    def load_all(self):
        for row in self.database_context.select('* FROM country;'):
            self.countries[row[0]] = {
                'name': row[1],
                'aliases': [v.strip().lower() for v in (row[2] or '').split(',')]
            }

        for row in self.database_context.select('* FROM state;'):
            country_id = row[1]
            if country_id not in self.states:
                self.states[country_id] = {}
            self.states[country_id][row[0]] = {
                'name': row[2],
                'aliases': [v.strip().lower() for v in (row[4] or '').split(',')],
                'fips': row[5]
            }

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


class Log:
    def __init__(self, database_context):
        self.database_context = database_context

    def put_message(self, message):
        self.database_context.insert('_log(message) VALUES (%s)', [message])
        self.database_context.commit()
