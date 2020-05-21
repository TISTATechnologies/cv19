from ..base import Exporter
from cv19lib.utils import logger
from cv19lib.collector import ENGINES

log = logger.get_logger(__file__)


class SourceExporter(Exporter):
    def __init__(self, output_dir):
        super().__init__(output_dir / 'source')
        self.name = 'source'

    def load_grouped_data(self, day):
        for item in ENGINES.values():
            source_item = {}
            for field in ['name', 'url', 'description']:
                source_item[field] = item.get(field)
            self.add_item_to_export_safe(None, source_item)
