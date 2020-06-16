#!/usr/bin/env python3
# #############################################################################
# Helper script to check version and buildtime on the servers
# Values will be taken from the index.html page and from the _version.json file
# #############################################################################
import os
import json
import ssl
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
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        debug(f'Reading first {size} bytes from {url}...')
        with urllib.request.urlopen(url, context=ctx) as f:
            result = f.read(size).decode('utf-8')
        debug(f'Read {len(result)} bytes.')
        return result
    except Exception as ex:
        print(f'Error: {ex}')
        return ''


def get_buildtime_from_page(url):
    page_text = read_page(url)
    debug(f'Parse datetime from a raw page')
    buildtime = None
    try:
        key = 'buildtime="'
        start = page_text.find(key) + len(key)
        if start >= len(key):
            date_str = page_text[start:start + 19]
            buildtime = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        elif len(page_text) < 50:
            buildtime = datetime.strptime(page_text.split('\n')[0].strip()[0:19], "%Y-%m-%dT%H:%M:%S")
    except Exception as ex:
        print(f'Error parse datetime: {ex}')
    debug(f'Found {buildtime} buildtime')
    return buildtime or datetime(2000, 1, 1)

def read_version_file(url):
    raw_page = read_page(url)
    debug(f'Raw page has {len(raw_page)} bytes')
    try:
        version_data = json.loads(raw_page)
        buildtime = datetime.strptime(version_data.get('buildtime')[:19], "%Y-%m-%dT%H:%M:%S")
        version = version_data.get('version')
    except Exception as ex:
        debug(f'Error: {ex}')
        buildtime = datetime.datetime(2000, 1, 1)
        version = None
    return (version, buildtime)


def validate_buildtimes_for_domain(name):
    ts = int(time.time())
    page_time = get_buildtime_from_page(f'https://{name}')
    (version, version_time) = read_version_file(f'https://{name}/_version.json')
    debug(f'page: build-time={page_time}, version.json: build-time={version_time}, version={version}')
    diff = max([(page_time - version_time).total_seconds()])

    if diff > GOOD_DIFF_SEC:
        print(f'[ERR] {name.ljust(40)} v{version.ljust(12)}: {page_time} / {version_time} (min diff: {diff} sec)')
        return 1
    print(f'[OK ] {name.ljust(40)} v{version.ljust(12)}: {page_time} / {version_time}')
    return 0


def main(domain):
    res = validate_buildtimes_for_domain(domain or 'covid19.tistatech.com')
    return res


sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
