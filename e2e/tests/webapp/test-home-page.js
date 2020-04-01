const { Config } = require('../../helpers/config');
const { CovidData } = require('../../helpers/csv-helper');
const { CovidPage } = require('../../helpers/test-helper');


Feature('e2e tests for CV19 Web Application');

const cvData = new CovidData(new Config());

BeforeSuite((I) => {
    console.info(`Start e2e tests on the CV19 server: ${cvData.config.appUrl}`)
})

try {
    for (let zip of cvData.getTestZips()) {
        Scenario(`Test data for ${zip}`, (I) => {
            I.retry({ retries: 3, minTimeout: 1000 }).amOnPage(cvData.config.appUrl + '/#/');

            const cv19Page = new CovidPage(I);
            cv19Page.expectTitle();
            cv19Page.expectCDCWorning();
            cv19Page.putZip(zip);
            
            const realData = cvData.getDataByZip(zip)
            // console.info(`${JSON.stringify(realData, indent=1)}`);
            if (!realData) {
                // This is a specific situation when we don't have data for the zip code
                I.see(`Could not load county data for ${zip}`);
            } else {
                cv19Page.expectStateData(realData, (zip || '').toUpperCase() ==='US' ? 'usa' : 'state');
                cv19Page.expectCountyData(realData);
                const links = cvData.getExecutiveLinksByState('US', realData.state.id);
                cv19Page.expectExecutiveOrders(links);
            }
        });
    }
} catch (err) {
    console.error(`Error: ${err.stack || err}`);
}
