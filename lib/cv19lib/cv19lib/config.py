# settings.py
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv


def env(name, default=None):
    """ Get value from the system environment by name or by name with 'bamboo_' prefix
    """
    return os.getenv(name, os.getenv('bamboo_' + name, default))


class Config:
    def __init__(self):
        if 'TEMP' not in os.environ.keys():
            os.environ['TEMP'] = (os.environ.get('TMPDIR', os.environ.get('TMP')) or '/tmp').rstrip('/')
        debug = env('DEBUG', '').lower() in ['true', 'on', 'yes']
        prj_dir = Path(__file__).parent / '..' / '..' / '..'
        load_dotenv(dotenv_path=prj_dir / '.env', override=True, verbose=debug)
        self.debug = str(env('DEBUG', 'False')).lower() in ['true', 'on', 'yes']
        self.db_port = int(env('PGPORT', '5432'))
        self.db_host = env('PGHOST', 'localhost')
        self.db_schema = env('PGSCHEMA', 'public')
        self.db_name = env('PGDATABASE', 'postgres')
        self.db_user = env('PGUSER', 'postgres')
        self.db_pass = env('PGPASSWORD', 'secret')
        self.log_file = env('LOG')
        self.minify = env('MINIFY', 'true').lower() in ['true', 'on', 'yes']
        self.temp_dir = Path(tempfile.mkdtemp())
        self.format_json = True
        self.format_csv = env('FORMAT_CSV', '').lower() in ['true', 'on', 'yes']

    def __str__(self):
        res = []
        res.append(f'DATABASE = postgres://{self.db_host}:****@{self.db_host}:{self.db_port}'
                   f'/{self.db_name}?schema={self.db_schema}')
        res.append(f'TEMP = {self.temp_dir}')
        res.append(f'DEBUG = {self.debug}')
        return ','.join(res)


config = Config()
