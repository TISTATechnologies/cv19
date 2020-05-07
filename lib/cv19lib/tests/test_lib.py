#!/usr/bin/env python3
from cv19lib.utils.helper import DatabaseContext
from .base import BaseTest


class TestDatabaseContext(BaseTest):
    def setUp(self):
        # pylint: disable=protected-access
        self.db = DatabaseContext()._connect()
        self.db.references.load_all()

    def tearDown(self):
        if self.db:
            # pylint: disable=protected-access
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

    def test_find_state(self):
        self._check_find_state_id('US', 'MD', 'MD')
        self._check_find_state_id('US', 'ID', 'ID')
        self._check_find_state_id('US', 'Idaho', 'ID')
        self._check_find_state_id('US', 'montana', 'MT')

    def _check_find_country_id(self, text, expected):
        self.assertEqual(self.db.references.find_country_id(text), expected)

    def _check_find_state_id(self, country_id, text, expected):
        self.assertEqual(self.db.references.find_state_id(country_id, text), expected)


if __name__ == '__main__':
    BaseTest.run_test_from_cli()
