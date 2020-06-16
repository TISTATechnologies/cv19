#!/usr/bin/env python3
import os
import re
import sys
from setuptools import setup, find_packages

APP_NAME = 'cv19srv'

is_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

# Alias: ./setup.py lint
if sys.argv[1:2] == ['lint']:
    THRESHOLD = 8.5
    print('Running "pylint" ...')
    # pip install pylint-fail-under --user
    sys.exit(int(os.system('pylint-fail-under --fail_under {1} ./{0}/ ./tests/'.format(APP_NAME, THRESHOLD)) > 0))

# Alias: ./setup.py install
if sys.argv[1:2] == ['install']:
    print('Running "pip install" ...')
    sys.exit(os.system(f'pip3 install .{"" if is_venv else "--user"}'))

# Alias: ./setup.py uninstall
if sys.argv[1:2] == ['uninstall']:
    print('Running "pip uninstall" ...')
    sys.exit(os.system('pip3 uninstall ' + APP_NAME))

# Alias: ./setup.py install --dev
if sys.argv[1:3] == ['install', '--dev']:
    print('Running "pip install" for development environment ...')
    sys.exit(os.system(f'pip3 -e .[dev]{"" if is_venv else "--user"}'))


# Alias: ./setup.py clean --all
if sys.argv[1:3] == ['clean', '--all']:
    import shutil
    from pathlib import Path
    PRJ_DIR = Path(__file__).resolve().parent
    print('Cleanup in "{0}" directory" ...'.format(PRJ_DIR))
    print('- Remove .pyc and .pyo files')
    [p.unlink() for p in PRJ_DIR.rglob('*.py[co]')]
    print('- Remove __pycache__ directories')
    [p.rmdir() for p in PRJ_DIR.rglob('__pycache__')]
    print('- Remove *.egg-info directories')
    shutil.rmtree(str(PRJ_DIR.joinpath(APP_NAME + '.egg-info')), ignore_errors=True)
    print('- Remove ./dist directory')
    shutil.rmtree(str(PRJ_DIR.joinpath('dist')), ignore_errors=True)


README = open('README.md').read()
VERSION = re.search("^__version__ = '(.*)'", open('{0}/{0}.py'.format(APP_NAME)).read(), re.M).group(1)


setup(
    name=APP_NAME,
    version=VERSION,
    description="",
    long_description=README,
    author="TISTA Science & Technology Corporation",
    url="https://github.com/TISTATechnologies",
    packages=find_packages(exclude=['tests']),
    install_requires=[
        'psycopg2-binary',
        'python-dotenv',
        'requests',
        'unidecode',
        'bs4'
    ],
    extras_require={
        'dev': [                        # Packages for development only.
            'pytest',                   # To install it you can use a command:
            'pylint-quotes',            # $ pip install -e .[dev]
            'pylint-unittest',
            'pylint-fail-under'
        ]
    },
    classifiers=[
        'Programming Language :: Python :: 3.8',
        "License :: OSI Approved :: Apache 2.0",
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: Utilities',
    ],
    entry_points={
        'console_scripts': ['cv19srv={0}:{0}.cli'.format(APP_NAME)]
    }
)
