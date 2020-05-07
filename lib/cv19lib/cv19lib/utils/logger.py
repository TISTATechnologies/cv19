import datetime
import os
import sys
import logging

LOG_DEBUG = False
LOG_FILE = None
try:
    from ..config import config
    LOG_DEBUG = config.debug
    LOG_FILE = config.log_file
except Exception:
    pass


def get_logger(name: str):
    log_fmt = '%(asctime)s [%(levelname)-5.5s] {%(name)-10.10s} %(message)s'
    log_level = logging.DEBUG if LOG_DEBUG else logging.INFO
    logging.basicConfig(format=log_fmt, datefmt='%H:%M:%S', level=log_level)
    log_name = '.'.join(os.path.basename(os.path.splitext(name or __name__)[0]).split('.')[-2:])
    logger = logging.getLogger(log_name)
    if LOG_FILE:
        now = datetime.datetime.now()
        log_file = LOG_FILE \
            .replace('#DATE#', now.strftime('%Y%m%d')) \
            .replace('#DATETIME#', now.strftime('%Y%m%d-%H%M%S')) \
            .replace('#SCRIPT#', os.path.splitext(os.path.basename(sys.argv[0]))[0])
        # sys.stdout.write(f'Log file: {LOG_FILE}{os.linesep}')
        fh = logging.FileHandler(log_file)
        fh.setLevel(level=log_level)
        fh.setFormatter(logging.Formatter(log_fmt, datefmt='%H:%M:%S'))
        logger.addHandler(fh)
    return logger


__all__ = ['get_logger']
