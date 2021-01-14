const { Config } = require('../../helpers/config');
const { CovidData } = require('../../helpers/csv-helper');
const { CovidStaticApi } = require('../../helpers/test-helper');
const countiesWithoutData = require('../us-counties-without-data.json')

const config = new Config();
const cvData = new CovidData(config);
const cvApi = new CovidStaticApi(config);
const log = config.log;
const fipsWithNoData = countiesWithoutData.map((i) => i['fips']);

const testZips = cvData.getTestZips();
const yesterday = config.testDate;
const expectEqualNumbers = (num1, num2) => {
    const num1Str = String(num1 === undefined ? null : num1).split(',').join('');
    const num2Str = String(num2 === undefined ? null : num2).split(',').join('');
    expect(num1Str).toEqual(num2Str);
}

const expectDataApiEqualRealData =async (day, realDataItems) => {
    // log.debug(JSON.stringify(realDataItems, null, 2));
    if (!realDataItems || realDataItems.length <= 0) {
        // This is a specific situation when we don't have data for the zip code
        expect([]).toHaveLength(0);
    } else {
        const index = cvData.getRandomInt(realDataItems.length);
        const realData = realDataItems[index];
        log.debug(`REAL DATA: ${JSON.stringify(realData)}`);
        const state_id = realData.county ? realData.county.state_id : null;
        const fips = realData.county ? realData.county.fips : null
        const stateMustHave = !(fips && fips.startsWith('US'));
        const data = await cvApi.getData('US', state_id, fips, day);
        log.debug(`API DATA: ${JSON.stringify(data)}`);
        expect(realData).toBeTruthy();
        if (stateMustHave) {
            expect(realData.state || null).not.toBeNull();
        }
        
        expect(data).toBeTruthy();
        expect(data).toHaveLength(1);
        const dataRow = data[0];
        expect(dataRow.date).toEqual(day === 'latest' ? yesterday : day);
        expect(dataRow.country_id).toEqual('US');
        if (stateMustHave) {
            expect(dataRow.state_id || 'US').toEqual(realData.state.id);
        }

        expect(String(dataRow.date)).toEqual(day);
        expect(String(dataRow.datetime || '').substring(0, 10)).toEqual(day);

        if (!realData.county) {
            expect(dataRow.name).toEqual(realData.state.name);
            expectEqualNumbers(dataRow.datetime, realData.state.datetime);
            expectEqualNumbers(dataRow.population, realData.state.population);
            expectEqualNumbers(dataRow.confirmed, realData.state.confirmed_val1);
            expectEqualNumbers(dataRow.deaths, realData.state.deaths_val1);
            expectEqualNumbers(dataRow.active, realData.state.active_val1);
            expectEqualNumbers(dataRow.recovered, realData.state.recovered_val1);
            expectEqualNumbers(dataRow.hospitalized_currently, realData.state.hospitalized_currently_val1);
        } else {
            expect(dataRow.name).toEqual(realData.county.name);
            expect(dataRow.fips).toEqual(realData.county.fips);
            expectEqualNumbers(dataRow.datetime, realData.county.datetime);
            expectEqualNumbers(dataRow.population, realData.county.population);
            expectEqualNumbers(dataRow.confirmed, realData.county.confirmed_val1);
            expectEqualNumbers(dataRow.deaths, realData.county.deaths_val1);
            expectEqualNumbers(dataRow.active, realData.county.active_val1);
            expectEqualNumbers(dataRow.recovered, realData.county.recovered_val1);
        }
    }
}

const testStaticDataOnDayByFips = (day, fips_list) => {
    log.debug(`Test data for ${JSON.stringify(fips_list)} fips on the day: ${day}.`);
    for (let i = 0, len = fips_list.length; i < len; i += 1) {
        const fips = fips_list[i];
        it(`Test data for ${fips} fips`, async () => {
            const realDataItem = await cvData.getDataByFips(fips, day, fipsWithNoData);
            await expectDataApiEqualRealData(day, realDataItem ? [realDataItem] : []);
        });
    };
}
const testStaticDataOnDayByZips = (day) => {
    log.debug(`Test data for ${JSON.stringify(testZips)} zips on the day: ${day}.`);
    for (let i = 0, len = testZips.length; i < len; i += 1) {
        const zip = testZips[i];
        it(`Test data for ${zip} zip`, async () => {
            const realDataItems = await cvData.getDataByZip(zip, undefined, fipsWithNoData);
            await expectDataApiEqualRealData(day, realDataItems);
        });
    };
};

describe("Test Static API calls ", () => {
    beforeAll(() => {
        jest.setTimeout(config.apiTimeout);
        log.info(`Start static api tests on the CV19 server: ${cvApi.apiDataUrl.href}`)
    })
    describe(`Test special locations (${yesterday})`, () => {
        const specialLocationsFiltered = cvData.specialLocationsFips.filter((i) => !fipsWithNoData.includes(i));
        testStaticDataOnDayByFips('latest', specialLocationsFiltered);
    });
    describe(`Test data (${yesterday})`, () => {
        testStaticDataOnDayByZips(yesterday);
        testStaticDataOnDayByFips(yesterday, ['USDC1']);
    });
    // TODO: Add historical data test
});
