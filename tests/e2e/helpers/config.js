const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const { getDayForApi } = require('./util');

/**
 * Get value from the system environment by name or by name with 'bamboo_' prefix
 */
const env = (name, defValue = null) => {
    return process.env[name] || process.env['bamboo_' + name] || defValue; 
}

class Config {
    constructor() {
        this.isDebug = env('DEBUG', 'false') === 'true';
        const envFile = path.resolve(__dirname, '..', '..', '..', '.env')
        if (fs.existsSync(envFile)) {
            dotenv.config({ path: envFile });
        // } else {
        //     console.error(`Config file '${envFile}' not found.`);
        //     process.exit(1);
        }
        
        this.appUrl = env('APP_SERVER_URL', env('REACT_APP_SERVER_URL'));
        this.apiUrl = env('API_SERVER_URL', env('REACT_API_SERVER_URL'));
        this.apiStaticCovidUrl = env('COVID_DATA_URL', env('REACT_APP_COVID_DATA_URL'));
        this.apiStaticCommonUrl = env('COMMON_DATA_URL', env('REACT_APP_COMMON_DATA_URL'));
        this.apiJwt = env('REACT_APP_JWT_TOKEN');
        this.apiTimeout = (+(env('API_TIMEOUT') || 30)) * 1000;     // Default 15 sec.
        this.zipCount = +(env('ZIP_COUNT') || env('ZIPS_COUNT') || 10);
        this.zips = env('ZIPS');
        this.zipsRandom = env('ZIPS_RANDOM');
        this.is_debug = env('DEBUG') === 'true';
        this.data_file = env('DATA_FILE') || path.join(__dirname, 'cv19-daily-data.json');
        this.executive_links_file = env('EXECUTIVE_LINKS_FILE')
            || path.join(__dirname, 'cv19-executive-links-data.json');
        this.zips_file = env('ZIPS_FILE') || path.join(__dirname, 'cv19-zips-data.json');
        this.special_locations_file = env('SPECIAL_LOCATIONS_FILE')
            || path.join(__dirname, 'cv19-special-locations-data.json');

        this.window_width = +(env('DEF_WINDOW_WIDTH') || 1900);
        this.window_height = +(env('DEF_WINDOW_HEIGHT') || 1080);
        this.headless = (env('HEADLESS') !== 'false');
        const testServer = ((env('SELENIUM_SERVER') || 'localhost') + ':4444').split(':');
        this.seleniumHost = testServer[0];
        this.seleniumPort = +(testServer[1])
        this.test_driver = (env('TEST_DRIVER') || 'webdriver').toLowerCase();
        this.testDate = getDayForApi(env('TEST_DATE', env('TEST_DAY')));

        this.log = {
            info: (message) => console.debug(message),
            error: (message) => console.error(message),
            warn: (message) => console.warn(message),
        };
        if (this.isDebug) {
            this.log.debug = (message) => console.debug(message);
        } else {
            this.log.debug = (message) => {};
        }
        this.updateEnvValue('PGHOST');
        this.updateEnvValue('PGPORT');
        this.updateEnvValue('PGUSER');
        this.updateEnvValue('PGPASSWORD');
        this.updateEnvValue('PGDATABASE');
        this.updateEnvValue('PGSCHEMA');
        this.log.info(`Test date: ${this.testDate}`);
    }

    
    updateEnvValue (name) {
        const bambooName = 'bamboo_' + name;
        if (!(name in process.env) && bambooName in process.env) {
            this.log.debug(`Substitute ${bambooName} - ${name}`);
            process.env[name] =  process.env[bambooName];
        }
    }

    getTestDriverInfo() {
        let res = `driver=${this.test_driver}`;
        if (this.seleniumHost) {
            res += `, host=${this.seleniumHost}:${this.seleniumPort}`;
        }
        return res;
    }

    getConnectionString() {
        return `postgres://${process.env.PGUSER}:***@${process.env.PGHOST}:${process.env.PGPORT}/`
            + `${process.env.PGDATABASE}?schema=${process.env.PGSCHEMA}`;
    }
}

module.exports.Config = Config;