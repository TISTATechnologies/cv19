const url = require('url');
const { getRequest } = require('./util');
const { Config } = require('../helpers/config');

const log = new Config().log;

class CovidPage {
  constructor(I, config) {
    this.county_popup_selector = '#zip-search-input-popup';
    this.I = I;
    this.defTimeout = 10; // in seconds
    this.config = config;
  }

  compareFips(fips1, fips2) {
    // Put 'fake' fips with letter first and the real fips with number after
    const toOrderVal = (x) => /^[0-9]/.test(x) ? `9_${x}` : `1_${x}`;
    const a = toOrderVal(fips1 || '');
    const b = toOrderVal(fips2 || '');
    return (a > b) - (a < b);
  }

  putZip(zip) {
    if (zip && zip !== 'US') {
      this.I.fillField('#zip-search-input', zip);
    } else {
      this.I.fillField('#zip-search-input', '');
    }
  }
  // async getZip() {
  //     return this.I.grabTextFrom('#zip-search-input');
  // }
  expectTitle(title = undefined) {
    this.I.seeInTitle(title || 'TISTA COVID-19 Tracker');
  }
  expectCDCWarning() {
    this.I.see(
      'NOTE: New CDC guidance could cause an increase in the number of deaths attributed to COVID-19.'
    );
    this.I.see('See this report for more details.');
  }

  expectCountyPopupWithNoElement() {
    this.I.dontSeeElement(this.county_popup_selector);
    this.I.see('No options');
  }
  // async expectCountyPopupShown(len=undefined) {
  //     await this.I.waitForVisible(this.county_popup_selector, this.defTimeout);
  //     this.I.seeElement(this.county_popup_selector);
  //     if (len !== undefined) {
  //         for (let i=0; i < len; i += 1) {
  //             this.I.seeElement(`#zip-search-input-option-${i}`);
  //         }
  //     }
  // }
  expectNoCountyPopup() {
    this.I.dontSeeElement(this.county_popup_selector);
  }
  selectItemCountyInPopup(index) {
    const itemElementSelector = `#zip-search-input-option-${index}`;
    log.debug(`Select ${itemElementSelector} element`);
    this.I.seeElement(itemElementSelector);
    this.I.click(itemElementSelector);
  }
  expectProperDataBox(level, dataItem, boxName, boxKey, allowZero = false) {
    const value = dataItem[`${boxKey}_val1`];
    const rate = dataItem[`${boxKey}_val2`];
    if (value !== null && value !== undefined && (allowZero || value !== '0')) {
      this.I.see(`${boxName}`);
      this.I.see(`${value}`, `#${level}-${boxKey}-value`);
      this.I.see(`${rate} per 100k`, `#${level}-${boxKey}-rate`);
    } else {
      this.I.dontSeeElement(`#${level}-${boxKey}-value`);
      this.I.dontSeeElement(`#${level}-${boxKey}-rate`);
    }
  }
  expectStateData(data, level) {
    const stateHeader = `COVID-19 Data for ${data.state.name}`;
    //this.I.waitForText(stateHeader, this.defTimeout);
    this.I.see(stateHeader);
    this.I.see(`Population: ${data.state.population}`, `#${level}-population`);
    this.expectProperDataBox(
      level,
      data.state,
      'Confirmed Cases',
      'confirmed',
      true
    );
    this.expectProperDataBox(level, data.state, 'Deaths', 'deaths', true);
    this.expectProperDataBox(level, data.state, 'Active Cases', 'active');
    this.expectProperDataBox(level, data.state, 'Recoveries', 'recovered');
    this.expectProperDataBox(level, data.state, 'Current Hospitalized', 'hospitalized');
  }
  expectCountyData(data) {
    if (!data || !data.county) {
      return;
    }
    if (!data.state || data.state.id === 'US') {
        this.I.see(`USA / ${data.county.name}`);
    } else {
        this.I.see(`USA / ${data.state.name} / ${data.county.name}`);
    }
    this.I.see(`COVID-19 Data for ${data.county.name}`);
    this.I.see(`Population: ${data.county.population}`, `#county-population`);
    this.expectProperDataBox(
      'county',
      data.county,
      'Confirmed Cases',
      'confirmed',
      true
    );
    this.expectProperDataBox('county', data.county, 'Deaths', 'deaths', true);
    this.expectProperDataBox('county', data.county, 'Active Cases', 'active');
    this.expectProperDataBox('county', data.county, 'Recoveries', 'recovered');
  }
  expectExecutiveOrders(data) {
    if (data && data.length > 0) {
      this.I.see('COVID-19 Critical Executive Orders for');
      for (let i = 0, len = data.length; i < len; i += 1) {
        const item = data[i];
        // Some of the executive orders notes are very long, remove double spaces and make it shorter
        const title = (item.note || '').replace(/  +/g, ' ').substring(0, 50);
        this.I.see(title);
      }
    } else {
      this.I.dontSee('COVID-19 Critical Executive Orders for');
    }
  }
}

class CovidApi {
  constructor(config) {
    this.config = config;
    this.apiUrl = url.parse(this.config.apiUrl);
  }

  getDataByFips(fips, date) {
    let pathWithQuery = null;
    if ((fips || 'US').toUpperCase() === 'US') {
      const country_id = 'US';
      pathWithQuery =
        `/covid_data_stat?location_type=eq.country` +
        `&country_id=eq.${country_id}&date=eq.${date}&limit=1`;
    } else {
      pathWithQuery = `/covid_data_stat?or=(fips.eq.${fips})&date=eq.${date}&limit=1`;
    }
    return getRequest(this.apiUrl.href, pathWithQuery, this.config.apiJwt);
  }
}

class CovidStaticApi {
  constructor(config) {
    this.config = config;
    this.apiDataUrl = url.parse(this.config.apiStaticCovidUrl);
    this.apiCommonUrl = url.parse(this.config.apiStaticCommonUrl);
    log.debug(`apiDataUrl: ${this.apiDataUrl.href}`);
    log.debug(`apiCommonUrl: ${this.apiCommonUrl.href}`);
  }

  getData(country_id, state_id, fips, date) {
    let root = this.apiDataUrl.href;
    if (!root.endsWith('/')) {
      root += '/';
    }
    const countryIdParam = country_id.toLowerCase();
    const stateIdParam = state_id ? state_id.toLowerCase() : null;
    let url = './daily/' + date.replace(/-/g, '') + '/';
    if (!stateIdParam) {
      url += countryIdParam;
    } else if (!fips || fips.startsWith('000')) {
      url += countryIdParam + '/' + stateIdParam;
    } else {
      url += countryIdParam + '/' + stateIdParam + '/' + fips;
    }
    return getRequest(root, url  + '.json');
  }
}

module.exports.CovidPage = CovidPage;
module.exports.CovidApi = CovidApi;
module.exports.CovidStaticApi = CovidStaticApi;
