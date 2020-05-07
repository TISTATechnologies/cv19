import unittest
import uuid
from pathlib import Path


class BaseTest(unittest.TestCase):
    def setUp(self):
        self.tests_dir = Path(__file__).parent

    def random_text(self):
        return uuid.uuid4().hex

    @staticmethod
    def run_test_from_cli():
        unittest.main()
