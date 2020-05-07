const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

class Config {
    constructor() {
        const envFile = path.resolve(__dirname, '..', '..', '.env')
        if (!fs.existsSync(envFile)) {
            console.error(`Config file '${envFile}' not found.`);
            process.exit(1);
        }
        dotenv.config({ path: envFile })
        this.appUrl = process.env.APP_URL;
        this.apiUrl = process.env.REACT_APP_SERVER_URL;
        this.apiStaticCovidUrl = process.env.REACT_APP_COVID_DATA_URL;
        this.apiStaticCommonUrl = process.env.REACT_APP_COMMON_DATA_URL;
        this.apiJwt = process.env.REACT_APP_JWT_TOKEN;
        this.apiTimeout = (+(process.env.API_TIMEOUT || 30)) * 1000;     // Default 15 sec.
        this.zipCount = +(process.env.ZIP_COUNT || 10);
        this.is_debug = process.env.DEBUG === 'true';
        this.data_file = process.env.DATA_FILE || path.join(__dirname, 'cv19-daily-data.json');
        this.executive_links_file = process.env.EXECUTIVE_LINKS_FILE
            || path.join(__dirname, 'cv19-executive-links-data.json');
        this.zips_file = process.env.ZIPS_FILE || path.join(__dirname, 'cv19-zips-data.json');

        this.window_width = +(process.env.DEF_WINDOW_WIDTH || 1200);
        this.window_height = +(process.env.DEF_WINDOW_HEIGHT || 1080);
        this.headless = (process.env.HEADLESS !== 'false');
        const testServer = ((process.env.SELENIUM_SERVER || 'localhost') + ':4444').split(':');
        this.seleniumHost = testServer[0];
        this.seleniumPort = +(testServer[1])
        this.test_driver = (process.env.TEST_DRIVER || 'webdriver').toLowerCase();

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