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
        this.apiJwt = process.env.REACT_APP_JWT_TOKEN;
        this.apiTimeout = (+(process.env.API_TIMEOUT || 30)) * 1000;     // Default 15 sec.
        this.zipCount = +(process.env.ZIP_COUNT || 10);
        this.is_debug = process.env.DEBUG === 'true';
        this.data_file = process.env.DATA_FILE || path.join(__dirname, 'cv19-daily-data.json');
        this.executive_links_file = process.env.EXECUTIVE_LINKS_FILE
            || path.join(__dirname, 'cv19-executive-links-data.json');
        this.zips_file = process.env.ZIPS_FILE || path.join(__dirname, 'cv19-zips-data.json');
    }

    getConnectionString() {
        return `postgres://${process.env.PGUSER}:***@${process.env.PGHOST}:${process.env.PGPORT}/`
            + `${process.env.PGDATABASE}?schema=${process.env.PGSCHEMA}`;
    }
}

module.exports.Config = Config;