#!/usr/bin/env python3
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str((Path(__file__).parent.parent.parent / 'services').resolve()))
from lib.helper import DatabaseContext


class TestDatabaseContext(unittest.TestCase):
    def setUp(self):
        self.db = DatabaseContext()._connect()
        self.db.references.load_all()

    def tearDown(self):
        if self.db:
            self.db._close()

    def test_references_core(self):
        self.assertEqual(len(self.db.references.countries), 242)

        self.assertEqual(len(self.db.references.states), 1)
        self.assertEqual(len(self.db.references.states.get('US', {})), 59)

    def test_find_country(self):
        self._check_find_country_id('US', 'US')
        self._check_find_country_id('CH', 'CH')
        self._check_find_country_id('United States of America', 'US')
        self._check_find_country_id('France', 'FR')

    def test_find_country(self):
        self._check_find_state_id('US', 'MD', 'MD')
        self._check_find_state_id('US', 'ID', 'ID')
        self._check_find_state_id('US', 'Idaho', 'ID')
        self._check_find_state_id('US', 'montana', 'MT')

    def _check_find_country_id(self, text, expected):
        self.assertEqual(self.db.references.find_country_id(text), expected)

    def _check_find_state_id(self, country_id, text, expected):
        self.assertEqual(self.db.references.find_state_id(country_id, text), expected)


if __name__ == '__main__':
    unittest.main()