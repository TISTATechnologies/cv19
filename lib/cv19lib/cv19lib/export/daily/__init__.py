# pylint: disable=R0801
import json
import os
from pathlib import Path
from cv19lib.utils import logger
from cv19lib.utils.helper import DateTimeHelper
from .covid_data import CovidDataExporter
from .executive_news import ExecutiveOrdersExporter
from .source import SourceExporter

log = logger.get_logger('daily')


def run(day, output_dir):
    log.info(f'Start export daily data on {day}...')

    if day > DateTimeHelper.get_today_date():
        log.warning(f'Skip future day')
        return False

    log.info(f'Output directory: {output_dir}')
    SourceExporter(output_dir).run(day)
    ExecutiveOrdersExporter(output_dir).run(day)
    CovidDataExporter(output_dir).run(day)
    log.info(f'End export daily data on {day}')
    return True
