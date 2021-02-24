import datetime
from ..utils import logger
from ..utils.helper import DateTimeHelper
from . import cdc
from . import covidtracking
from . import custom_areas
from . import executive_news
from . import jhu

log = logger.get_logger('collector')


""" List of all external sources which we are using to pull Covid-19 related data.
"""
ENGINES = {
    'jhu': {
        'name': 'JHU CSSE',
        'instance': jhu,
        'url': 'https://github.com/CSSEGISandData/COVID-19',
        'description': ('The data repository operated by the Johns Hopkins University Center '
                        'for Systems Science and Engineering (JHU CSSE)')
    },
    'covidtracking': {
        'name': 'The COVID Tracking Project',
        'instance': covidtracking,
        'url': 'https://covidtracking.com',
        'description': ('The COVID Tracking Project collects and publishes the most complete testing data '
                        'available for US states and territories.')
    },
    'cdc': {
        'name': 'Centers for Disease Control and Prevention',
        'instance': cdc,
        'url': 'https://cdc.gov.com',
        'description': ('As the nation\'s health protection agency, CDC saves lives and protects people from health, '
                        'safety, and security threats.')
    },
    'executive-news': {
        'name': 'COVID-19 Resources for State Leaders',
        'instance': executive_news,
        'url': 'https://web.csg.org/covid19/executive-orders',
        'description': 'The Council of State Governments'
    },
    'custom-areas': {
        'instance': custom_areas
    }
}


def run(engine_name: str, args: list) -> bool:
    """ Main entrypoint for collector service
    """
    start_time = datetime.datetime.now()
    log.info(f'Start collecting data...')
    day = DateTimeHelper.parse_date(args[0] if len(args) > 0 else None)
    if day > DateTimeHelper.get_today_date():
        log.warning(f'Skip future day')
        return False

    if engine_name not in ENGINES.keys() and engine_name != 'all':
        log.error(f'Engine "{engine_name}" not found.')
        return False

    engines = ENGINES.keys() if engine_name == 'all' else [engine_name]
    for engine in engines:
        log.info(f'Start [{engine_name}] collector on {day}...')
        engine = ENGINES[engine_name]
        engine['instance'].run(day, args)
        log.info(f'End [{engine}] collector on {day}')
    log.info(f'End collector data (duration = {datetime.datetime.now() - start_time})')
    return True
