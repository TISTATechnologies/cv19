# pylint: disable=R0801
import datetime
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


def create_index_file(output_dir: Path) -> None:
    """ Create index.html file at the root of the /covid/vX/ directory
    with short description about an exported data
    """
    version = os.environ.get('DATA_VERSION', '1')
    src = Path(__file__).parent / 'index.html'
    dest = output_dir / 'index.html'
    log.info(f'Create index {dest} file (data-version={version})')
    text = src.read_text().replace('{VERSION}', version)
    dest.write_text(text)


def run(engine_name: str, args: list) -> bool:
    """ Main entrypoint for exporter service
    """
    if engine_name not in ENGINES.keys():
        log.error(f'Engine "{engine_name}" not found.')
        return False

    start_time = datetime.datetime.now()
    log.info(f'Start export data...')
    output_dir = Path(args[1] if len(args) > 1 else os.getcwd())
    day = DateTimeHelper.parse_date(args[0] if len(args) > 0 else None)
    if day > DateTimeHelper.get_today_date():
        log.warning(f'Skip future day')
        return False

    exporters = ENGINES[engine_name]
    for export in exporters:
        log.info(f'Start export "{export}" data on {day} into the {output_dir}...')
        export.run(day, output_dir)
        log.info(f'End export "{export}" data on {day}')
    create_index_file(output_dir)
    log.info(f'End export data (duration = {datetime.datetime.now() - start_time})')
    return True
