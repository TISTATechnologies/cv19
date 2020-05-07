from . import covidtracking
from . import executive_news
from . import jhu
from ..utils import logger

log = logger.get_logger('collector')

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
    'executive-news': {
        'name': 'COVID-19 Resources for State Leaders',
        'instance': executive_news,
        'url': 'https://web.csg.org/covid19/executive-orders',
        'description': 'The Council of State Governments'
    }
}


def run(engine_name, args):
    if engine_name not in ENGINES.keys():
        log.error(f'Engine "{engine_name}" not found.')
        return False
    log.info(f'Start [{engine_name}] collector...')
    engine = ENGINES[engine_name]
    engine['instance'].run(args)
    log.info(f'End [{engine}] collector')
    return True
