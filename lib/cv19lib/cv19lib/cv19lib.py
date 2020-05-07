import sys
from cv19lib.utils import logger
from cv19lib.config import config

from cv19lib import collector
from cv19lib import export

__version__ = '1.0.0'
__author__ = 'Tista'


log = logger.get_logger(__file__)


class CV19:
    def __init__(self):
        log.debug(f'{self.__class__.__name__} config: {config}')

    def show_help(self):
        print('Usage: cv19-cli <collect|export> [engine] [args...]')
        print('Collectors:')
        print(f'    {", ".join(collector.ENGINES)}')
        return False

    def run(self, args):
        try:
            cmd = sys.argv[1] if len(sys.argv) > 1 else '--help'
            log.debug(f'Command line: {cmd} {args}')
            if cmd == 'collect':
                engine = sys.argv[2] if len(sys.argv) > 2 else None
                args = sys.argv[3:]
                return collector.run(engine, args)
            if cmd == 'export':
                args = sys.argv[2:]
                return export.run(args)
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
