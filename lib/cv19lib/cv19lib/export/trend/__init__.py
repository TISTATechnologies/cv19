# pylint: disable=R0801
import json
import os
from pathlib import Path
from cv19lib.utils import logger

from .covid_data import TrendData

log = logger.get_logger('export')


def run(day, output_dir):
    log.info(f'Start export trend data...')

    log.info(f'Output directory: {output_dir}')
    TrendData(output_dir).run(day)
    log.info(f'End export daily data')
    return True
