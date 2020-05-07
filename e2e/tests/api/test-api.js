const { Config } = require('../../helpers/config');
const { CovidData } = require('../../helpers/csv-helper');
const { CovidApi } = require('../../helpers/test-helper');
const { getDayForApi } = require('../../helpers/util');


const config = new Config();
const cvData = new CovidData(config);
const cvApi = new CovidApi(config);
const testZips = cvData.getTestZips();
const log = config.log;

const expectEqualNumbers = (num1, num2) => {
    const num1Str = String(num1).split(',').join('');
    const num2Str = String(num2).split(',').join('');
    expect(num1Str).toEqual(num2Str);
}
describe("Test API calls", () => {
    const day = getDayForApi(undefined);;
    beforeAll(() => {
        jest.setTimeout(config.apiTimeout);
        log.info(`Start api tests on the CV19 server: ${cvApi.apiUrl.href}`)
    })
    describe(`Test data`, () => {
        log.debug(`Test data for ${JSON.stringify(testZips)} zips.`);
        for (let i = 0, len = testZips.length; i < len; i += 1) {
            const zip = testZips[i];
            it(`Test data for ${zip}`, async () => {
                const realDataItems = await cvData.getDataByZip(zip);
                // log.debug(JSON.stringify(data, null, 2));
                // log.debug(JSON.stringify(realData, null, 2));
                
                if (!realDataItems || realDataItems.length <= 0) {
                    // This is a specific situation when we don't have data for the zip code
                    expect([]).toHaveLength(0);
                } else {
                    const index = cvData.getRandomInt(realDataItems.length);
                    const realData = realDataItems[index];
                    log.debug(`REAL DATA: ${JSON.stringify(realData)}`);
                    const fips = realData.county ? realData.county.fips : 'US'
                    const data = await cvApi.getDataByFips(fips, day);
                    log.debug(`API DATA: ${JSON.stringify(data)}`);
                    expect(realData).toBeTruthy();
                    
                    expect(data).toBeTruthy();
                    expect(data).toHaveLength(1);
                    const dataRow = data[0];
                    expect(dataRow.date).toEqual(day);
                    expect(dataRow.country_id).toEqual('US');
                    expect(dataRow.state_id || 'US').toEqual(realData.state.id);

                    if (!realData.county) {
                        expect(dataRow.location_name).toEqual(realData.state.name);
                        expectEqualNumbers(dataRow.population, realData.state.population);
                        expectEqualNumbers(dataRow.confirmed, realData.state.confirmed_val1);
                        expectEqualNumbers(dataRow.deaths, realData.state.deaths_val1);
                        expectEqualNumbers(dataRow.active, realData.state.active_val1);
                        expectEqualNumbers(dataRow.recovered, realData.state.recovered_val1);
                    } else {
                        expect(dataRow.location_name).toEqual(realData.county.name);
                        expect(dataRow.fips).toEqual(realData.county.fips);
                        expectEqualNumbers(dataRow.population, realData.county.population);
                        expectEqualNumbers(dataRow.confirmed, realData.county.confirmed_val1);
                        expectEqualNumbers(dataRow.deaths, realData.county.deaths_val1);
                        expectEqualNumbers(dataRow.active, realData.county.active_val1);
                        expectEqualNumbers(dataRow.recovered, realData.county.recovered_val1);
                    }
                }
            });
        };
    });
});
