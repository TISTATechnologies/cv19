// Allowed system environment variables:
// SELENIUM_SERVER  - selenium host:port (default: localhost:4444)
// HEADLESS         - start tests in headless mode (default: true)
// TEST_DRIVER      - webdriver / nightmare (default: webdriver)
// DEF_WINDOW_WIDTH - browser windows width (default: 1200)
// DEF_WINDOW_HEIGHT - browser windows height (default: 1080)
const { setHeadlessWhen } = require('@codeceptjs/configure');
const { Config } = require('./helpers/config');

const config = new Config();

const useWebDriver = () => {
    // https://codeception.com/docs/modules/WebDriver
    console.info(`Using Selenium server on ${config.seleniumHost}:${config.seleniumPort}`);
    const args = [];
    if (config.headless) {
        args.push('--headless');
        setHeadlessWhen(true);
    }
    args.push(`--window-size=${config.window_width},${config.window_height}`);
    args.push('--new-window');
    args.push('--no-sandbox');
    args.push('--disable-gpu');
    args.push('--disable-extensions');
    args.push('--allow-running-insecure-content');
    args.push('--ignore-certificate-errors');
    args.push('--log-level=3');
    // args.push('--page-load-strategy=normal');

    const chromeOptions = { args: args };
    return {
        WebDriver : {
            url: 'http://localhost',
            host: config.seleniumHost,
            port: config.seleniumPort,
            browser: 'chrome',
            capabilities: { chromeOptions: chromeOptions },
            smartWait: 5000,
            getPageTimeout: 20000,
            scriptsTimeout: 20000,
            restart: true
          }
    };
}

const useNightmare = () => {
    return {
        Nightmare: {
            'url': 'https://innovation-demo.tistatech.com',
            'waitForTimeout': 10000,
            'show': !config.headless,
            "restart": true,
            "width": config.window_width,
            "height": config.window_height,
        },
    };
}

const getTestHelpers = () => {
    switch (config.test_driver) {
        case 'webdriver': return useWebDriver();
        case 'nightmare': return useNightmare();
        default: throw new ValueError(`Unknownd test driver "${config.test_driver}"`);
    }
}

exports.config = {
  tests: './tests/webapp/test*.js',
  output: './output',
  helpers: getTestHelpers(),
  include: {
    I: './steps_file.js'
  },
  bootstrap: false,
  mocha: {},
  name: 'e2e',
  plugins: {
    retryFailedStep: {
      enabled: true
    },
    screenshotOnFail: {
      enabled: true
    }
  }
}