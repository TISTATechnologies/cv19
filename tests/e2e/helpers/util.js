const https = require('https')
const url = require('url');

const debug = (message) => {
    if (process.env.DEBUG === 'true') {
        console.debug(message);
    }
}

module.exports.shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

module.exports.getDayForApi = (date) => {
    let curDate = date;
    let resDateStr = null;
    debug(`- Source date: ${curDate}`);
    if (curDate) {
        const dateObj = new Date(curDate);
        if (dateObj === "Invalid Date" || isNaN(dateObj)) { // (typeof date === 'string' || date instanceof String)) {
            curDate = new Date(Date.parse(String(curDate)));
        } else {
            curDate = dateObj;
        }
    } else {
        // If date not specified -> return yesterday
        curDate = new Date(Date.now() - (3600 * 24 * 1000));
    }
    resDateStr = curDate.toISOString().substr(0, 10);
    debug(`- Parsed date: ${resDateStr}`);
    return resDateStr;
}

module.exports.getRequest = (apiRootUrl, pathWithQuesry='', jwt=undefined) => {
    const apiUrlObj = new URL(pathWithQuesry, apiRootUrl);
    return new Promise((resolve, reject) => {
        const options = {
            hostname: apiUrlObj.hostname,
            port: +(apiUrlObj.port || 443),
            path: `${apiUrlObj.pathname || ''}${apiUrlObj.search || ''}`,
            method: 'GET',
            rejectUnauthorized: false,
        };
        debug(`Make request: ${apiUrlObj.href}`);
        
        if (jwt) {
            options.headers = { Authorization: `Bearer ${jwt}` };
            debug(`Authorization: Bearer *********`);
        }
        const req = https.request(options, (res) => {
            if (res.statusCode >= 400 || res.statusCode < 200) {
                console.error(`Response error [HttpStatusCode: ${res.statusCode}]: ${apiUrlObj.href}`);
                reject(new Error(`HttpStatusCode=${res.statusCode}`));
            }
            const resBody = []
            res.on('data', (chunk) => {
                resBody.push(chunk);
            });
            res.on('end', () => {
                try {
                    const body = JSON.parse(Buffer.concat(resBody).toString('utf-8'));
                    resolve(body);
                } catch(err) {
                    reject(err);
                }
            })
        });
        req.on('error', (err) => {
            console.error(err);
            reject(err);
        });
        req.end()
    });
}