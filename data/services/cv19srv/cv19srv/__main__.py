#!/usr/bin/env python3
import sys
from pathlib import Path


if __name__ == '__main__':
    if not __package__:                     # call: python <package dir>
        SETUP_PY_DIR = Path(__file__).resolve().parent.parent
        sys.path.insert(0, str(SETUP_PY_DIR))
    from cv19srv import cv19srv
    sys.exit(cv19srv.cli())
