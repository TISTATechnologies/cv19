from .utils import logger
from .utils.helper import DatabaseContext

log = logger.get_logger(__file__)


def check():
    log.debug(f'Check database')
    try:
        with DatabaseContext() as db:
            rows = db.select('id FROM state WHERE country_id=\'US\' AND type=\'state\';') or []
            if len(rows) == 50:
                log.info(f'Database status - OK')
                return True
            log.error(f'Database "state" table values incorrect')
            return False
    except Exception as ex:
        log.debug(ex)
        log.error(str(ex))
    log.error(f'Database status  - failed')
    return False
