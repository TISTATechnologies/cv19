#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
from configparser import ConfigParser
from os import path
import sys
import inspect
import unidecode

# Add parent directory to the import search paths
sys.path.insert(0, path.dirname(path.dirname(path.abspath(inspect.getfile(inspect.currentframe())))))
import lib.logger as logger
from lib.helper import DatabaseContext

script_name = path.splitext(path.basename(sys.argv[0]))[0]
log = logger.getLogger(script_name)

log.info(f'Start collect executive order\'s links')
config = ConfigParser()
config.read(path.join(path.dirname(__file__), 'config.ini'))
url = config['DEFAULT']['URL']
log.debug(f'Load page from: {url}')
content = requests.get(url)
log.debug(f'Parsing html page...')
soup = BeautifulSoup(content.text, 'html.parser')
soup.prettify()
contentdiv = soup.find('div', {'class': 'elementor-element elementor-element-f5aa65c elementor-widget elementor-widget-text-editor'})
usa = contentdiv.find_all('p')
with DatabaseContext() as db:
    data = db.references.load_all()
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
            add_on = ['Travel', 'Restaurant', 'State of Emergency declared',
                      'Stay at Home Order', 'Quarantine', 'Mortgage Payment']
            if any(x in state_order for x in add_on):
                try:
                    sql = ''.join(['covid_info_link ', '(country_id,state_id,fips,note,url) ',
                                   'VALUES (%s,%s,%s,%s,%s);'])
                    values = ('US', state_id, state_fips, state_order, link)
                    log.debug(f'Insert item into the database: {values}')
                    out = db.insert(sql, values)
                    db.commit()
                    success_links_count += 1
                except Exception as err:
                    if 'duplicate key value' in str(err):
                        duplicate_links_count += 1
                        log.warning(err)
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
