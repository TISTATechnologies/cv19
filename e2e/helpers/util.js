const https = require('https')
const url = require('url');

module.exports.shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

module.exports.getDayForApi = (date) => {
    if (date) {
        return date;
    } else {
        const yesterday = new Date(Date.now() - (3600 * 24 * 1000));
        const month = String(yesterday.getMonth() + 1);
        const day = String(yesterday.getDate());
        return `${yesterday.getFullYear()}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`
    }
}

module.exports.getRequest = (apiRootUrl, pathWithQuesry, jwt=undefined) => {
    const apiUrlObj = new URL(pathWithQuesry, apiRootUrl);
    return new Promise((resolve, reject) => {
        const options = {
            hostname: apiUrlObj.hostname,
            port: +(apiUrlObj.port || 443),
            path: `${apiUrlObj.pathname || ''}${apiUrlObj.search || ''}`,
            method: 'GET',
            rejectUnauthorized: false,
        };
        console.debug(`Make request: ${apiUrlObj.href}`);
        
        if (jwt) {
            options.headers = { Authorization: `Bearer ${jwt}` };
            console.debug(`Authorization: Bearer *********`);
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