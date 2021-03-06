const fs = require('fs')
const { shuffleArray } = require('../helpers/util');
const { Config } = require('../helpers/config');

const log = (new Config()).log;

class CovidData {
    constructor(config) {
        this.config = config;
        this.debug = this.config.is_debug ? console.debug : (msg) => {};
        this.loadDataFile();
        this.loadExecutiveLinksFile();
        this.loadZip2FipsFile();
        this.loadSpecialLocations();
        this.debug('-- Debug mode enabled --');
    }

    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    loadDataFile() {
        log.debug(`Load data file: ${this.config.data_file}`);
        const rawdata = fs.readFileSync(this.config.data_file);
        this.debug(`Parse test data into the dictionary`);
        this.data = JSON.parse(rawdata);
        const counties = Object.keys(this.data.counties);
        log.debug(`Loaded data: found ${counties.length} counties.`);
    }

    loadExecutiveLinksFile() {
        log.debug(`Load executive links file: ${this.config.executive_links_file}`);
        const rawdata = fs.readFileSync(this.config.executive_links_file);
        this.debug(`Parse executive links into the memory`);
        this.executiveLinks = JSON.parse(rawdata);
        log.debug(`Loaded executive links: found ${this.executiveLinks.length} links.`);
    }

    loadSpecialLocations() {
        log.debug(`Load special locations file: ${this.config.special_locations_file}`);
        const rawdata = fs.readFileSync(this.config.special_locations_file);
        this.debug(`Parse special locations into the memory`);
        this.specialLocationsFips = JSON.parse(rawdata).map((i) => i['fips']);
        log.debug(`Loaded special locations: found ${this.executiveLinks.length} items.`);
    }

    loadZip2FipsFile() {
        log.debug(`Load zips file: ${this.config.zips_file}`);
        const rawdata = fs.readFileSync(this.config.zips_file);
        this.debug(`Parse zips into the memory`);
        this.zip2fips = {};
        this.fips2zips = {};
        const zip2fipsRaw = JSON.parse(rawdata);
        for (let i = 0, len = zip2fipsRaw.length; i < len; i += 1) {
            const item = zip2fipsRaw[i];
            if (!(item.zip in this.zip2fips)) {
                this.zip2fips[item.zip] = [];
            }
            this.zip2fips[item.zip].push(item.fips);

            if (!(item.fips in this.fips2zips)) {
                this.fips2zips[item.fips] = [];
            }
            this.fips2zips[item.fips].push(item.zip);
        }
        log.debug(`Loaded zips: found ${Object.keys(this.zip2fips).length} links.`);
        log.debug(`Loaded fips: found ${Object.keys(this.fips2zips).length} links.`);
    }

    getTestZips() {
        let result = null;
        if (this.config.zipsRandom) {
            result = shuffleArray(this.config.zipsRandom.split(',').map((i) => i.trim()));
            log.info(`Use zips from the env.ZIPS: ${result}`);
        } else if (this.config.zips) {
            result = this.config.zips.split(',').map((i) => i.trim());
            log.info(`Use zips from the env.ZIPS: ${result}`);
        } else {
            const testZips = Object.keys(this.zip2fips);
            result = ['US'].concat(shuffleArray(testZips).slice(0, this.config.zipCount));
            log.info(`Loaded zips [${result.length}]`);
            // log.log(`ZIPS: ${testZips}`)
        }
        log.info(`Make tests with ${JSON.stringify(result)} zips`);
        return (result || ['US']).filter((z) => z);
    }

    getDataByFips(fips, day=undefined, fipsWithNoData=[]) {
        this.debug(`Looking data for ${fips} fips (${this.data.counties.length} items)`);
        if (fips in fipsWithNoData) {
            log.debug(`FIPS ${fips} is in the No Data List - Skip.`);
            return null;
        }
        for (let i = 0, len = this.data.counties.length; i < len; i += 1) {
            const item = this.data.counties[i];
            if (item && item.county && String(item.county.fips) === String(fips)) {
                log.debug(`Found item: ${JSON.stringify(item)}`);
                return item;
            }
        }
        return null;
    }

    getDataByZip(zip, day=undefined, fipsWithNoData=[]) {
        if (!this.data) {
            throw new Error(`Load test data first`);
        }
        const countiesOnly = Object.keys(this.data.counties);
        this.debug(`Looking to the ${zip} zip in the test data (keys: ${countiesOnly.length})`);
        const values = []
        if ((zip || 'US').toUpperCase() === 'US') {
            values.push(this.data.US);
        } else {
            const fipsList = this.zip2fips[zip];
            if (!fipsList) {
                this.debug(`Fips not found for ${zip} zip.`);
            } else {
                this.debug(`Found fips: ${JSON.stringify(fipsList)}`);
                for (let fips of fipsList) {
                    this.debug(`Check fips: ${fips} -> ${fipsWithNoData.includes(fips)} (no data list = ${fipsWithNoData.length})`)
                    if (fipsWithNoData.includes(fips)) {
                        log.debug(`The fips ${fips} is in the No Data List - Skip.`);
                    } else {
                        const resItem = this.getDataByFips(fips, day);
                        if (! /^[0-9]/.test(fips) && !resItem.state) {
                            // 'area' fips doesn't have state info, substitute US data into the state
                            resItem.state = this.data.US.state;
                        }
                        if (resItem) {
                            values.push(resItem);
                        }
                    }
                }
            }
        }
        this.debug(`Use data: ${JSON.stringify(values)}`);
        return  values;
    }

    getZipsByFips(fipsList) {
        const resultZips = [];
        for (let fips of (fipsList || [])) {
            const zips = this.fips2zips[fips];
            resultZips.push.apply(resultZips, zips);
        }
        return resultZips;
    }

    getExecutiveLinksByState(country_id, state_id, day=undefined) {
        if (!this.executiveLinks) {
            throw new Error(`Load test data first`);
        }

        this.debug(`Looking to the executive links for ${country_id} - ${state_id} state`);
        const result = [];
        for (let i = 0, len = this.executiveLinks.length; i < len; i += 1) {
            const item = this.executiveLinks[i];
            if (item && item.country_id === country_id && item.state_id === state_id) {
                result.push(item)
            }
        }
        this.debug(`Found ${result.length} executive links.`);
        return result;
    }
}

module.exports.CovidData = CovidData;
