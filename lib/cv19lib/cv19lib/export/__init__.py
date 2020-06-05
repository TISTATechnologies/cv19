# pylint: disable=R0801
import json
import os
from pathlib import Path
from ..utils import logger
from ..utils.helper import DateTimeHelper
from . import daily
from . import history
from . import trend

log = logger.get_logger('export')

ENGINES = {
    'daily': [daily],
    'trend': [trend],
    'history': [history],
    'all': [daily, trend, history]
}


def create_index_file(output_dir):
    src = Path(__file__).parent / 'index.html'
    dest = output_dir / 'index.html'
    log.info(f'Create {dest} file')
    dest.write_text(src.read_text())


def run(engine_name, args):
    log.info(f'Start export data...')
    output_dir = Path(args[1] if len(args) > 1 else os.getcwd())
    day = DateTimeHelper.parse_date(args[0] if len(args) > 0 else None)

    exporters = ENGINES[engine_name]
    for export in exporters:
        export.run(day, output_dir)

    create_index_file(output_dir)
    log.info(f'End export data')
    return True
