# pylint: disable=R0801
# #############################################################################
# - Export covid data from the databse into the json files
# - Usage: export <YYYY-MM-DD|latest> [output directory]
# - Requirements: psycopg2
# #############################################################################
import json
import os
from pathlib import Path
from ..utils import logger
from ..utils.helper import DateTimeHelper
from .covid_data import CovidDataExporter
from .executive_news import ExecutiveOrdersExporter
from .source import SourceExporter

log = logger.get_logger('export')


def show_help():
    print(''.join([l[4:] for l in open(__file__, 'r').readlines() if l.startswith('# -')]))


def create_index_file(output_dir):
    src = Path(__file__).parent / 'index.html'
    dest = output_dir / 'index.html'
    log.info(f'Create {dest} file')
    dest.write_text(src.read_text())


def run(args):
    arg1 = args[0] if len(args) > 0 else 'help'
    if arg1 in ('help', '--help'):
        show_help()
        return False

    output_dir = Path(args[1] if len(args) > 1 else os.getcwd())
    day = DateTimeHelper.parse_date(arg1)
    log.info(f'Start export data on {day}...')

    if day > DateTimeHelper.get_today_date():
        log.warning(f'Skip future day')
        return False

    log.info(f'Output directory: {output_dir}')
    SourceExporter(output_dir).run(day)
    ExecutiveOrdersExporter(output_dir).run(day)
    CovidDataExporter(output_dir).run(day)
    create_index_file(output_dir)
    log.info(f'End export data on {day}')
    return True
