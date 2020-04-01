import datetime
import os
import sys
import logging
from lib.config import config


def getLogger(name: str):
    format = '%(asctime)s [%(levelname)-5.5s] {%(name)-10.10s} %(message)s'
    log_level = logging.DEBUG if config.debug else logging.INFO
    logging.basicConfig(format=format,
                        datefmt='%H:%M:%S',    # '%Y-%m-%d %H:%M:%S',
                        level=log_level)
    log_name = '.'.join(os.path.basename(os.path.splitext(name or __name__)[0]).split('.')[-2:])
    logger = logging.getLogger(log_name)
    if config.log_file:
        now = datetime.datetime.now()
        log_file = config.log_file \
            .replace('#DATE#', now.strftime('%Y%m%d')) \
            .replace('#DATETIME#', now.strftime('%Y%m%d-%H%M%S')) \
            .replace('#SCRIPT#', os.path.splitext(os.path.basename(sys.argv[0]))[0])
        # sys.stdout.write(f'Log file: {log_file}{os.linesep}')
        fh = logging.FileHandler(log_file)
        fh.setLevel(level=log_level)
        fh.setFormatter(logging.Formatter(format, datefmt='%H:%M:%S'))
        logger.addHandler(fh)
    return logger
