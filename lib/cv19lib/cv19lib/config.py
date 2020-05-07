# settings.py
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv


class Config:
    def __init__(self):
        if 'TEMP' not in os.environ.keys():
            os.environ['TEMP'] = (os.environ.get('TMPDIR', os.environ.get('TMP')) or '/tmp').rstrip('/')
        debug = os.getenv('DEBUG', '').lower() in ['true', 'on', 'yes']
        prj_dir = Path(__file__).parent / '..' / '..' / '..'
        load_dotenv(dotenv_path=prj_dir / '.env', override=True, verbose=debug)
        self.debug = str(os.getenv('DEBUG', 'False')).lower() in ['true', 'on', 'yes']
        self.db_port = int(os.getenv('PGPORT', '5432'))
        self.db_host = os.getenv('PGHOST', 'localhost')
        self.db_schema = os.getenv('PGSCHEMA', 'public')
        self.db_name = os.getenv('PGDATABASE', 'postgres')
        self.db_user = os.getenv('PGUSER', 'postgres')
        self.db_pass = os.getenv('PGPASSWORD', 'secret')
        self.log_file = os.getenv('LOG')
        self.minify = os.getenv('MINIFY', 'true').lower() in ['true', 'on', 'yes']
        self.temp_dir = Path(tempfile.mkdtemp())
        self.format_json = True
        self.format_csv = os.getenv('FORMAT_CSV', '').lower() in ['true', 'on', 'yes']

    def __str__(self):
        res = []
        res.append(f'DATABASE = postgres://{self.db_host}:****@{self.db_host}:{self.db_port}'
                   f'/{self.db_name}?schema={self.db_schema}')
        res.append(f'TEMP = {self.temp_dir}')
        res.append(f'DEBUG = {self.debug}')
        return ','.join(res)


config = Config()
