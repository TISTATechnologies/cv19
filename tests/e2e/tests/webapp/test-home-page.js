const { Config } = require("../../helpers/config");
const { CovidData } = require("../../helpers/csv-helper");
const { CovidPage } = require("../../helpers/test-helper");

Feature("e2e tests for CV19 Web Application");

const config = new Config();
const cvData = new CovidData(config);
const log = config.log;

BeforeSuite((I) => {
  log.info(`Start e2e tests on the cv19 server: ${config.appUrl}`);
  log.info(`Settings: ${config.getTestDriverInfo()}`);
});

try {
  for (let zip of cvData.getTestZips()) {
    Scenario(`Test data for ${zip}`, (I) => {
      log.info(`Testing data for ${zip}...`);
      I.retry({ retries: 3, minTimeout: 1000 }).amOnPage(
        cvData.config.appUrl + "/#/"
      );

      const cv19Page = new CovidPage(I, config);
      cv19Page.expectTitle();
      cv19Page.expectCDCWorning();
      cv19Page.expectNoCountyPopup();
      cv19Page.putZip(zip);

      const realDataItems = cvData.getDataByZip(zip);
      const realDataItemsLen = realDataItems ? realDataItems.length : 0;
      log.debug(`Data length: ${realDataItemsLen}`);
      let selectedCounty = null;
      // log.debug(`Data: ${JSON.stringify(realDataItems, indent=1)}`);
      if (realDataItemsLen === 0) {
        // This is a specific situation when we don't have data for the zip code
        // The popup still appears with no data, it simply says "No Options"
        // cv19Page.expectCountyPopupWithNoElement();
      } else {
        const countyNames = realDataItems
          .map((i) => (i.county || {}).name)
          .sort();
        log.debug(`Counties: ${JSON.stringify(countyNames)}`);
        let realData = null;
        if (zip && zip !== "US") {
          const index = cvData.getRandomInt(realDataItemsLen);
          cv19Page.selectItemCountyInPopup(index);
          log.debug(
            `Select random item in #${index} (length=${realDataItemsLen})`
          );
          const selectedCounty = countyNames[index];
          log.debug(`Select county ${selectedCounty}`);
          for (let i = 0; i < realDataItemsLen; i += 1) {
            const item = realDataItems[i];
            if (item.county && item.county.name === selectedCounty) {
              realData = item;
              break;
            }
          }
          log.debug(
            `Found real data county: ${
              realData ? realData.county.name : "NULL"
            }`
          );
        } else {
          realData = realDataItemsLen > 0 ? realDataItems[0] : null;
        }
        if (realData === null) {
          throw new Error(
            `Can't find selected '${selectedCounty}' county in the real data: ${JSON.stringify(
              realDataItems
            )}`
          );
        }
        log.debug(`Check state data on the page`);
        cv19Page.expectStateData(
          realData,
          (zip || "").toUpperCase() === "US" ? "usa" : "state"
        );
        log.debug(`Check county data on the page`);
        cv19Page.expectCountyData(realData);
        const links = cvData.getExecutiveLinksByState("US", realData.state.id);
        log.debug(`Check executive orders on the page`);
        cv19Page.expectExecutiveOrders(links);
        log.debug(`Done with test data for ${zip}`);
      }
    });
  }
} catch (err) {
  log.error(`Error: ${err.stack || err}`);
}
