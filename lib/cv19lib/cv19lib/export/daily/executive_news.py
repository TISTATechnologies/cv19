from ..base import Exporter
from cv19lib.utils import logger
from cv19lib.utils.helper import DateTimeHelper, DatabaseContext

log = logger.get_logger(__file__)


class ExecutiveOrdersExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'executive-orders')
        self.name = 'executive orders'

    def load_grouped_data(self, day):
        log.debug(f'Load all data from the database...')
        with DatabaseContext() as db:
            for row in db.select('* FROM covid_info_link;'):
                (_, country_id, state_id, fips, _, url, note, published, created) = row
                item = {'country_id': country_id, 'state_id': state_id, 'fips': fips,
                        'url': url, 'published': DateTimeHelper.datetime_string(published),
                        'created': DateTimeHelper.datetime_string(created)}
                if note:
                    item['note'] = note
                self.add_item_to_export_all_levels(item)
