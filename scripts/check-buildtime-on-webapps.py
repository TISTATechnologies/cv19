#!/usr/bin/env python3
import os
import json
import sys
import time
import urllib.request
from datetime import datetime

GOOD_DIFF_SEC = 60 * 5


def debug(m):
    if os.environ.get('DEBUG') == 'true':
        sys.stderr.write(f'{m}{os.linesep}')


def read_page(url, size=200):
    try:
        debug(f'Reading first {size} bytes from {url}...')
        with urllib.request.urlopen(url) as f:
            result = f.read(size).decode('utf-8')
        debug(f'Read {len(result)} bytes.')
        return result
    except Exception as ex:
        print(f'Error: {ex}')
        return ''


def get_buildtime_from_page(page_text):
    debug(f'Parse datetime from a raw page')
    try:
        key = 'buildtime="'
        start = page_text.find(key) + len(key)
        if start >= len(key):
            date_str = page_text[start:start + 19]
            return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        elif len(page_text) < 50:
            return datetime.strptime(page_text.split('\n')[0].strip()[0:19], "%Y-%m-%dT%H:%M:%S")
    except Exception as ex:
        print(f'Error parse datetime: {ex}')
    return None


def get_buildtimes_from_url(url):
    raw_page = read_page(url)
    debug(f'Raw page has {len(raw_page)} bytes')
    if '.json' in url:
        debug(f'Parse datetime from a json data')
        try:
            buildtime = json.loads(raw_page).get('buildtime')[:19]
            buildtime = datetime.strptime(buildtime, "%Y-%m-%dT%H:%M:%S")
        except Exception as ex:
            debug(f'Error: {ex}')
            buildtime = datetime.datetime(2000, 1, 1)
    else:
        buildtime = get_buildtime_from_page(raw_page)
    debug(f'Found {buildtime} buildtime')
    return buildtime or datetime(2000, 1, 1)


def get_buildtimes_for_domain(name):
    ts = int(time.time())
    page1_time = get_buildtimes_from_url(f'https://{name}')
    ver1_time = get_buildtimes_from_url(f'https://{name}/_version.json')
    debug(f'page1_time = {page1_time}, ver1_time = {ver1_time}')
    diff = max([(page1_time - ver1_time).total_seconds()])

    if diff > GOOD_DIFF_SEC:
        print(f'[ERR] {name}: {page1_time} / {ver1_time} (min diff: {diff} sec)')
        return 1
    print(f'[OK ] {name}: {page1_time} / {ver1_time}')
    return 0


def main():
    get_buildtimes_for_domain('innovation-dev.tistatech.com')
    res = get_buildtimes_for_domain('innovation-demo.tistatech.com') \
        + get_buildtimes_for_domain('innovation.tistatech.com')
    return 0


sys.exit(main())
