#!/usr/bin/env python3
# #############################################################################
# Service to collect Executive Orders related with the Covid-19
# Site: https://web.csg.org/covid19/executive-orders
# #############################################################################
from bs4 import BeautifulSoup

from ..utils import logger
from ..utils.helper import DatabaseContext, DownloadHelper
from .base import Collector

log = logger.get_logger(__file__)


class ExecutiveOrderCollector(Collector):
    """ Service to collect Executive Orders related with the Covid-19
    Site: https://web.csg.org/covid19/executive-orders
    """
    def __init__(self):
        super().__init__('executive_orders')
        self.download_helper = DownloadHelper()

    def pull_data_by_day(self, day):
        url = 'https://web.csg.org/covid19/executive-orders/'
        log.info(f'Start collect executive order\'s links with arguments: {day}')
        log.debug(f'Load page from: {url}')
        content = self.download_helper.read_content(url, False)
        log.debug(f'Parsing html page...')
        soup = BeautifulSoup(content.decode('utf-8'), 'html.parser')
        soup.prettify()
        class_selector = 'elementor-element elementor-element-f5aa65c elementor-widget elementor-widget-text-editor'
        contentdiv = soup.find('div', {'class': class_selector})
        usa = contentdiv.find_all('p')
        with DatabaseContext() as db:
            self.start_pulling(db, day)
            for state in usa:
                log.debug(f'Processing state section')
                for strong_tag in state.find_all('strong'):
                    if strong_tag.text != '':
                        us_state = strong_tag.text
                        if us_state == 'US VIRGIN ISLANDS':
                            us_state = us_state.lstrip('US ')
                        state_id = db.references.find_state_id('US', us_state)
                        if state_id is not None:
                            state_fips = '000' + db.references.states['US'][state_id]['fips']
                log.info(f'Processing "{us_state}" state.')
                idx = 0
                for atags in state.find_all('a'):
                    idx += 1
                    link = atags.get('href')
                    order = str(atags.text)
                    state_order = order.strip('*').strip()
                    add_on = ['Masks', 'Utility', 'Late Fees', 'Eviction', 'Travel', 'Restaurant', 'Easing',
                              'Reopening', 'Phase', 'State of Emergency declared', 'Face Covering',
                              'Stay at Home Order', 'Quarantine', 'Mortgage Payment']
                    if any(x in state_order for x in add_on):
                        sql = 'covid_info_link (country_id,state_id,fips,note,url) VALUES (%s,%s,%s,%s,%s);'
                        values = ('US', state_id, state_fips, state_order, link)
                        self.insert_into_db(db, idx, sql, values, True)
                    else:
                        self.counter_items_notfound += 1

                log.info(f'Complete with "{us_state}" state')
                self.end_pulling(db, day, idx)
            db.commit()
        log.info(f'End collect executive order\'s links')
        return True


# pylint: disable=unused-argument
def run(day, args=None):
    ExecutiveOrderCollector().run(day)
    return True
