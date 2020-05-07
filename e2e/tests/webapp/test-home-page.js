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
            cv19Page.expectNoCountyPopup();
            cv19Page.putZip(zip);

            const realDataItems = cvData.getDataByZip(zip)
            const realDataItemsLen = realDataItems ? realDataItems.length : 0;
            cv19Page.debug(`Data length: ${realDataItemsLen}`);
            let selectedCounty = null;
            // cv19Page.debug(`Data: ${JSON.stringify(realDataItems, indent=1)}`);
            if (realDataItemsLen === 0) {
                // This is a specific situation when we don't have data for the zip code
                I.executeAsyncScript(cv19Page.expectCountyPopupWithNoElement);
            } else {
                const checkDataOnThePage = async () => {
                    let realData = null;
                    if (zip && zip !== 'US') {
                        const index = cv19Page.getRandomInt(realDataItemsLen);
                        cv19Page.debug(`Select random item in #${index} (length=${realDataItemsLen})`)
                        await cv19Page.expectCountyPopupShown(realDataItemsLen)
                        const selectedValue = await cv19Page.selectItemCountyInPopup(index);
                        // Get county name from the popop list text (it in the second line)
                        const selectedCounty = selectedValue.split('\n')[1].trim();
                        cv19Page.debug(`Select county ${selectedCounty}`)
                        for (let i = 0; i < realDataItemsLen; i += 1) {
                            const item = realDataItems[i];
                            if (item.county && item.county.name === selectedCounty) {
                                realData = item;
                                break;
                            }
                        }
                        cv19Page.debug(`Found real data county: ${realData ? realData.county.name : 'NULL'}`);
                    } else {
                        realData = realDataItemsLen > 0 ? realDataItems[0] : null;
                    }
                    if (realData === null) {
                        throw new Error(`Can't find selected '${selectedCounty}' county in the real data: ${JSON.stringify(realDataItems)}`);
                    }
                    cv19Page.debug(`Check state data on the page`);
                    cv19Page.expectStateData(realData, (zip || '').toUpperCase() ==='US' ? 'usa' : 'state');
                    cv19Page.debug(`Check county data on the page`);
                    cv19Page.expectCountyData(realData);
                    const links = cvData.getExecutiveLinksByState('US', realData.state.id);
                    cv19Page.debug(`Check executive orders on the page`);
                    cv19Page.expectExecutiveOrders(links);
                    cv19Page.debug(`Done with test data for ${zip}`);
                };
                I.executeAsyncScript(checkDataOnThePage);
            }
        });
    }
} catch (err) {
    console.error(`Error: ${err.stack || err}`);
}
