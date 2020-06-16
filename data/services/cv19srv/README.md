# cv19srv

This module contains all service code to collect, transform, and export Covid-19 data.

## Requirements
* Python 3.8+
* Python packages:
    - pyjwt
    - psycopg2
    - python-dotenv
    - requests
    - unidecode
    - bs4

Use a command to install all requirements: ```./setup.py install --dev```


## Launch

Start cv19srv cli: ```python3 -m cv19srv --help```


## Tests

Run unit tests: ```./setup.py test```

Static code analyzer: ```./setup.py lint```

*NOTE*: additional tests can be found outside the cv19src directory.
