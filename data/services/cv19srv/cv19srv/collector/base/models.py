import copy
import datetime
import hashlib
from decimal import Decimal
from typing import Any, Union
from cv19srv.utils.helper import Converter, DateTimeHelper, JsonHelper, MathHelper


class CovidDataItem:
    SOURCE_COMBINED = 0
    SOURCE_JHU = 1
    SOURCE_COVIDTRACKING = 2
    SOURCE_CDC = 3

    def __init__(self, source_id=None, country_id=None, state_id=None, fips=None, collected_datetime=None,
                 confirmed=None, deaths=None, recovered=None, active=None,
                 source_location=None, source_updated=None, geo_lat=None, geo_long=None,
                 hospitalized_currently=None, hospitalized_cumulative=None,
                 in_icu_currently=None, in_icu_cumulative=None,
                 on_ventilator_currently=None, on_ventilator_cumulative=None,
                 vaccination_distributed=None, vaccination_administered=None,
                 vaccination_adm_dose1=None, vaccination_adm_dose2=None):
        self.source_id = source_id
        self.country_id = country_id
        self.state_id = state_id
        self.fips = fips
        self.datetime = collected_datetime
        self.confirmed = confirmed
        self.deaths = deaths
        self.recovered = recovered
        self.active = active
        self.source_location = source_location
        self.source_updated = source_updated
        self.geo_lat = geo_lat
        self.geo_long = geo_long
        self.hospitalized_currently = hospitalized_currently
        self.hospitalized_cumulative = hospitalized_cumulative
        self.in_icu_currently = in_icu_currently
        self.in_icu_cumulative = in_icu_cumulative
        self.on_ventilator_currently = on_ventilator_currently
        self.on_ventilator_cumulative = on_ventilator_cumulative
        self.vaccination_distributed = vaccination_distributed
        self.vaccination_administered = vaccination_administered
        self.vaccination_adm_dose1 = vaccination_adm_dose1
        self.vaccination_adm_dose2 = vaccination_adm_dose2
        self.unique_key = None

    @staticmethod
    def from_db_item(item_values):
        res = CovidDataItem()
        for idx, key in enumerate(res.keys()):
            res[key] = item_values[idx]
        return res

    def clone(self):
        return copy.deepcopy(self)

    def __add__(self, other):
        if other is not None:
            for key in self.keys():
                # walk throw all 'numbers' fields and make a summary
                if key.endswith('_id') or key.startswith('geo_') or key.startswith('source_') \
                    or key.endswith('_key') or key in ('fips', 'datetime'):
                    continue
                self[key] = MathHelper.sum(self[key], other[key])
            self.source_updated = DateTimeHelper.now()
        return self

    def merge(self, other):
        if other is None:
            return self
        if self.country_id != other.country_id or self.state_id != other.state_id \
           or self.fips != other.fips or self.datetime != other.datetime:
            # we can merge only similar location
            return self
        for key in self.keys():
            if key.endswith('_id') or key in ('fips', 'datetime'):
                continue
            if self.source_id <= (other.source_id or 9999):
                self[key] = self[key] if self[key] is not None else other[key]
            else:
                self[key] = other[key] if other[key] is not None else self[key]
        if self.source_id != other.source_id:
            self.source_id = 0
            self.unique_key = self.get_unique_key()
        self.source_updated = DateTimeHelper.now()
        return self

    @property
    def active_calculated(self):
        if self.confirmed is not None and self.deaths is not None and self.recovered is not None:
            active = self.confirmed - self.deaths - self.recovered
            # when we have a wrong recovered data, we do not need to show wrong active case too
            return active if active >= 0 else None
        return None

    def get_unique_key(self) -> str:
        """ Calculate unique key for the covid data related to the datetime, location, and source
        """
        values_str = f'{self.country_id}{self.state_id}{self.fips}{self.datetime}'
        return f'{self.source_id:04o}' + hashlib.md5(values_str.encode()).hexdigest()

    def __str__(self) -> str:
        items = self.__dict__
        items['unique_key'] = self.get_unique_key()
        return JsonHelper.serialize(items)

    def __getitem__(self, key):
        return getattr(self, key, None)

    def __setitem__(self, key, value):
        return setattr(self, key, value)

    def keys(self):
        return sorted(vars(self).keys())

    def values(self):
        values = []
        for key in self.keys():
            if key == 'active':
                values.append(self[key] or self.active_calculated)
            elif key == 'unique_key':
                values.append(self.get_unique_key())
            else:
                values.append(self[key])
        return values


class RawDataItem:
    """ Helper class to wrap all raw data items from the data sources
    """
    def __init__(self, raw_row: list, idx: int = None):
        self.values = raw_row or []
        self.idx = idx
        self.length = len(self.values)

    def _is_key_number(self, key: Union[int, str]) -> bool:
        if key is not None and isinstance(key, int) or key.isnumeric():
            return True
        return False

    def __contains__(self, key: Union[int, str]) -> bool:
        if self._is_key_number(key):
            return int(key) < len(self.values)
        return key in self.values

    def get(self, key: Union[int, str], default: Any = None) -> Any:
        if key not in self:
            return default
        if self._is_key_number(key):
            return self.values[int(key)] or default
        return self.values.get(key) or default

    def get_int(self, key: Union[int, str], default=None) -> int:
        val = self.get(key, default)
        return int(float(val)) if val is not None else None

    def get_decimal(self, key: Union[int, str], default=None) -> Decimal:
        val = self.get(key, default)
        return Decimal(val) if val is not None else None

    def get_datetime(self, key: Union[int, str], default=None) -> datetime.datetime:
        val = self.get(key, default)
        if isinstance(val, datetime.datetime):
            return val
        return Converter.parse_datetime(val)

    def get_fips(self, key: Union[int, str]) -> str:
        val = self.get(key, None)
        return Converter.to_real_fips(val) if val else None
