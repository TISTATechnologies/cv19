# pylint: disable=R0801
import json
import os
from pathlib import Path
from cv19lib.utils import logger

from .covid_data import HistoryData

log = logger.get_logger('history')


def run(day, output_dir):
    log.info('Start export history data...')

    log.info(f'Output directory: {output_dir}')
    HistoryData(output_dir).run(day)
    log.info('End export history data')
    return True
