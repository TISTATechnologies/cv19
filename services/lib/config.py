# settings.py
import os
import tempfile
from dotenv import load_dotenv
from pathlib import Path


class Config:
    def __init__(self):
        debug = os.getenv('DEBUG', '').lower() in ['true', 'on', 'yes']
        prj_dir = Path(__file__).parent / '..' / '..'
        load_dotenv(dotenv_path=prj_dir / '.env', override=True, verbose=debug)
        self.debug = str(os.getenv('DEBUG', False)).lower() in ['true', 'on', 'yes']
        self.db_port = int(os.getenv('PGPORT', 5432))
        self.db_host = os.getenv('PGHOST', 'localhost')
        self.db_schema = os.getenv('PGSCHEMA', 'public')
        self.db_name = os.getenv('PGDATABASE', 'postgres')
        self.db_user = os.getenv('PGUSER', 'postgres')
        self.db_pass = os.getenv('PGPASSWORD', 'secret')
        self.log_file = os.getenv('LOG')
        self.temp_dir = Path(tempfile.mkdtemp())
        # self.cache_dir = Path(os.getenv('CACHE_DIR', self.db_dir / 'cache'))

    def __str__(self):
        res = []
        res.append(f'DATABASE = postgres://{self.db_host}:****@{self.db_host}:{self.db_port}'
                   f'/{self.db_name}?schema={self.db_schema}')
        res.append(f'TEMP = {self.temp_dir}')
        res.append(f'DEBUG = {self.debug}')
        return ','.join(res)


config = Config()

__all__ = [config]
