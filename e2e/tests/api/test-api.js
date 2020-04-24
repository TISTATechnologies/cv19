const { Config } = require('../../helpers/config');
const { CovidData } = require('../../helpers/csv-helper');
const { CovidApi } = require('../../helpers/test-helper');
const { getDayForApi } = require('../../helpers/util');


const config = new Config();
const cvData = new CovidData(config);
const cvApi = new CovidApi(config);
const testZips = cvData.getTestZips();

const expectEqualNumbers = (num1, num2) => {
    const num1Str = String(num1).split(',').join('');
    const num2Str = String(num2).split(',').join('');
    expect(num1Str).toEqual(num2Str);
}
describe("Test API calls", () => {
    const day = getDayForApi(undefined);;
    beforeAll(() => {
        jest.setTimeout(config.apiTimeout);
        console.info(`Start api tests on the CV19 server: ${cvApi.apiUrl.href}`)
    })
    describe(`Test data`, () => {
        console.info(`Test data for ${JSON.stringify(testZips)} zips.`);
        for (let i = 0, len = testZips.length; i < len; i += 1) {
            const zip = testZips[i];
            it(`Test data for ${zip}`, async () => {
                const realData = await cvData.getDataByZip(zip);
                const data = await cvApi.getDataByZip(zip, day);
                // console.log(JSON.stringify(data, null, 2));
                // console.log(JSON.stringify(realData, null, 2));
                
                if (!realData) {
                    // This is a specific situation when we don't have data for the zip code
                    expect(data || []).toHaveLength(0);
                } else {
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
                        expect(realData.county.zip).toEqual(zip);
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