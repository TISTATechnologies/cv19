const url = require('url');
const { getRequest} = require('./util');

class CovidPage {

    constructor(I) {
        this.county_popup_selector = '#zip-search-input-popup';
        this.I = I;
        this.isDebug = process.env.DEBUG === 'true';
        this.defTimeout = 10;        // in seconds
    }

    debug(message) {
        if (this.isDebug) {
            console.debug(message);
        }
    }

    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }
    
    putZip(zip) {
        if (zip && zip !== 'US') {
            this.I.fillField('#zip-search-input', zip);
        } else {
            this.I.fillField('#zip-search-input', '');
        }
    }
    async getZip() {
        return this.I.grabTextFrom('#zip-search-input');
    }
    expectTitle(title = undefined) {
        this.I.seeInTitle(title || 'TISTA COVID-19 Tracker');
    }
    expectCDCWorning() {
        this.I.see('NOTE: New CDC guidance could cause an increase in the number of deaths attributed to COVID-19.')
        this.I.see('See this report for more details.');
    }

    async expectCountyPopupWithNoElement() {
        this.I.dontSeeElement(this.county_popup_selector);
        this.I.see('No options');
        this.I.see('', '#zip-search-input-option-0');
    }
    async expectCountyPopupShown(len=undefined) {
        await this.I.waitForVisible(this.county_popup_selector, this.defTimeout);
        this.I.seeElement(this.county_popup_selector);
        if (len !== undefined) {
            for (let i=0; i < len; i += 1) {
                this.I.seeElement(`#zip-search-input-option-${i}`);
            }
        }
    }
    expectNoCountyPopup() {
        this.I.dontSeeElement(this.county_popup_selector);
    }
    async selectItemCountyInPopup(index) {
        this.I.seeElement(`#zip-search-input-option-${index}`);
        const selectedValue = await this.I.grabTextFrom(`#zip-search-input-option-${index}`);
        if (!selectedValue || selectedValue.length <= 0) {
            throw new Error(`Can't get text from the #zip-search-input-option-${index}`);
        }
        // this.I.click(`#zip-search-input-option-${index}`);
        // this.I.selectOption(this.county_popup_selector, value);
        //
        // NOTE: I.click and I.selectOption methods don't work with React application,
        // emulate click to the element from keyboard
        for (let i = 0; i <= index; i += 1) {
            this.I.pressKey('Down');
        }
        this.I.pressKey('Enter');
        
        return selectedValue;
    }
    expectProperDataBox(level, dataItem, boxName, boxKey, allowZero = false) {
        const value = dataItem[`${boxKey}_val1`];
        const rate = dataItem[`${boxKey}_val2`];
        if (value !== null && (allowZero || value !== '0')) {
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
        this.expectProperDataBox(level, data.state, 'Confirmed Cases', 'confirmed', true);
        this.expectProperDataBox(level, data.state, 'Deaths', 'deaths', true);
        this.expectProperDataBox(level, data.state, 'Active Cases', 'active');
        this.expectProperDataBox(level, data.state, 'Recoveries', 'recovered');
    }
    expectCountyData(data) {
        if (!data || !data.county) {
            return;
        }
        this.I.see(`USA / ${data.state.name} / ${data.county.name}`);
        this.I.see(`COVID-19 Data for ${data.county.name}`);
        this.I.see(`Population: ${data.county.population}`, `#county-population`);
        this.expectProperDataBox('county', data.county, 'Confirmed Cases', 'confirmed', true);
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

    getDataByZip(zip, date) {
        let pathWithQuery = null;
        if ((zip || 'US').toUpperCase() === 'US') {
            const country_id = 'US';
            pathWithQuery = `/covid_data_stat_with_zip?location_type=eq.country`
                + `&country_id=eq.${country_id}&date=eq.${date}&limit=1`;
        } else {
            pathWithQuery = `/covid_data_stat_with_zip?or=(zip.eq.${zip})&date=eq.${date}&limit=1`;
        }
        return getRequest(this.apiUrl.href, pathWithQuery, this.config.apiJwt);
    }
}

module.exports.CovidPage = CovidPage;
module.exports.CovidApi = CovidApi;
