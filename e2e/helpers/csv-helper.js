const fs = require('fs')
const { shuffleArray } = require('../helpers/util');

class CovidData {
    constructor(config) {
        this.config = config;
        this.debug = this.config.is_debug ? console.debug : (msg) => {};
        this.loadDataFile();
        this.loadExecutiveLinksFile();
    }

    loadDataFile() {
        console.info(`Load data file: ${this.config.data_file}`);
        const rawdata = fs.readFileSync(this.config.data_file);
        this.debug(`Parse test data into the dictionary`);
        this.data = JSON.parse(rawdata);
        const zips = Object.keys(this.data.zips);
        console.info(`Loaded data: found ${zips.length} zips.`);
    }

    loadExecutiveLinksFile() {
        console.info(`Load executive links file: ${this.config.executive_links_file}`);
        const rawdata = fs.readFileSync(this.config.executive_links_file);
        this.debug(`Parse executive links into the memory`);
        this.executiveLinks = JSON.parse(rawdata);
        console.info(`Loaded executive links: found ${this.executiveLinks.length} links.`);
    }

    getTestZips() {
        let result = null;
        if (process.env.ZIPS_RANDOM) {
            result = shuffleArray(process.env.ZIPS_RANDOM.split(',').map((i) => i.trim()));
            console.info(`Use zips from the env.ZIPS: ${result}`);
        } else if (process.env.ZIPS) {
            result = process.env.ZIPS.split(',').map((i) => i.trim());
            console.info(`Use zips from the env.ZIPS: ${result}`);
        } else {
            console.info(`Load zips file: ${this.config.zips_file}`);
            const fileRawData = String(fs.readFileSync(this.config.zips_file));
            let testZips = fileRawData.split('\n');
            result = ['US'].concat(shuffleArray(testZips).slice(0, this.config.zipCount));
            console.info(`Loaded zips [${result.length}]`);
        }
        console.info(`Make tests with ${JSON.stringify(result)} zips`);
        return (result || ['US']).filter((z) => z);
    }

    getDataByZip(zip, day=undefined) {
        if (!this.data) {
            throw new Error(`Load test data first`);
        }
        const zipsOnly = Object.keys(this.data.zips);
        this.debug(`Looking to the ${zip} zip in the test data (keys: ${zipsOnly.length})`);
        let value = null;
        if ((zip || 'US').toUpperCase() === 'US') {
            value = this.data.US;
        } else {
            for (let i = 0, len = this.data.zips.length; i < len; i += 1) {
                const item = this.data.zips[i];
                if (item && item.county && item.county.zip === zip) {
                    value = item;
                    break;
                }
            }
        }
        this.debug(`Use data: ${JSON.stringify(value)}`);
        return  value;
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
