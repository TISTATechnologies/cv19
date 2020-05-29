#!/usr/bin/env python3
import unidecode
import requests
from bs4 import BeautifulSoup

from ..utils import logger
from ..utils.helper import DatabaseContext

log = logger.get_logger(__file__)


def run(args=None):
    config_url = 'https://web.csg.org/covid19/executive-orders/'
    log.info(f'Start collect executive order\'s links with arguments: {args}')
    log.debug(f'Load page from: {config_url}')
    content = requests.get(config_url)
    log.debug(f'Parsing html page...')
    soup = BeautifulSoup(content.text, 'html.parser')
    soup.prettify()
    class_selector = 'elementor-element elementor-element-f5aa65c elementor-widget elementor-widget-text-editor'
    contentdiv = soup.find('div', {'class': class_selector})
    usa = contentdiv.find_all('p')
    with DatabaseContext() as db:
        db.references.load_all()
        for state in usa:
            log.debug(f'Processing state section')
            for strong_tag in state.find_all('strong'):
                if strong_tag.text != '':
                    us_state = strong_tag.text
                    if us_state == 'US VIRGIN ISLANDS':
                        us_state = us_state.lstrip('US ')
                    else:
                        pass
                    state_id = db.references.find_state_id('US', us_state)
                    if state_id is not None:
                        state_fips = '000' + db.references.states['US'][state_id]['fips']
            log.info(f'Processing "{us_state}" state.')
            success_links_count = 0
            failed_links_count = 0
            duplicate_links_count = 0
            for atags in state.find_all('a'):
                link = atags.get('href')
                order = atags.text
                state_order = unidecode.unidecode(order).strip('*').strip()
                add_on = ['Masks', 'Utility', 'Late Fees', 'Eviction', 'Travel', 'Restaurant', 'Easing', 'Reopening', 'Phase', 'State of Emergency declared', 'Face Covering', 'Stay at Home Order', 'Quarantine', 'Mortgage Payment']
                if any(x in state_order for x in add_on):
                    try:
                        sql = ''.join(['covid_info_link ', '(country_id,state_id,fips,note,url) ',
                                       'VALUES (%s,%s,%s,%s,%s);'])
                        values = ('US', state_id, state_fips, state_order, link)
                        log.debug(f'Insert item into the database: {values}')
                        db.insert(sql, values)
                        db.commit()
                        success_links_count += 1
                    except Exception as err:
                        err_message = str(err)
                        if 'duplicate key value' in err_message:
                            duplicate_links_count += 1
                            log.warning(err_message.rstrip().replace('\nDETAIL', ', DETAIL'))
                        else:
                            failed_links_count += 1
                            log.error(err)
                        db.rollback()
                else:
                    pass
            log.info(f'Complete with "{us_state}" state: '
                     f'{success_links_count} success links, {duplicate_links_count} duplicates, '
                     f'and {failed_links_count} errors.')
    log.info(f'End collect executive order\'s links')
    return True
