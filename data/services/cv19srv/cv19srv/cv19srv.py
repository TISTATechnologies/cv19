import sys
from cv19srv.utils import logger
from cv19srv.config import config

from cv19srv import collector
from cv19srv import export
from cv19srv import database

__version__ = '2.2.0'
__author__ = 'Tista'


log = logger.get_logger(__file__)


class CV19:
    def __init__(self):
        log.debug(f'{self.__class__.__name__} config: {config}')

    def show_help(self):
        print('Usage: cv19srv <collect|export|check-database> [engine] [args...]')
        print('Command: collect')
        print(f'  engines: {", ".join(collector.ENGINES)}, all')
        print(f'  args   : [YYYY-MM-DD|latest]')
        print(f'Command: export')
        print(f'  engines: {", ".join(export.ENGINES)}, all')
        print(f'  args   : [YYYY-MM-DD|latest] [output directory]')
        print('')
        print('Example:')
        print('  Collect data from JHU on 2020-05-15')
        print('    $ python3 -m cv19srv collect jhu 2020-05-15')
        print('  Export daily latest data from the database into the ./covid-data directory')
        print('    $ python3 -m cv19srv export daily latest ./covid-data')
        return False

    def run(self, args):
        try:
            if len(args) <= 0 or [a for a in args if a.lstrip('-') == 'help']:
                return self.show_help()
            cmd = args[0]
            log.debug(f'Command line: {cmd} {args}')
            if cmd == 'collect':
                engine = sys.argv[2] if len(sys.argv) > 2 else None
                args = sys.argv[3:]
                return collector.run(engine, args)
            if cmd == 'export':
                engine = sys.argv[2] if len(sys.argv) > 2 else None
                args = sys.argv[3:]
                return export.run(engine, args)
            if cmd == 'check-database':
                return database.check()
            if cmd.lstrip('-') == 'help':
                return self.show_help()
            log.error(f'Unknown command {cmd}')
        except Exception as ex:
            log.exception(ex)

        return False


def cli():
    app = CV19()
    return 0 if app.run(sys.argv[1:]) else 1


if __name__ == '__main__':
    sys.exit(cli())
