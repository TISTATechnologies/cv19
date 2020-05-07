const { setHeadlessWhen } = require('@codeceptjs/configure');

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
  tests: './tests/webapp/test*.js',
  output: './output',
  helpers: {
    Nightmare: {
        'url': 'https://innovation-demo.tistatech.com',
        'waitForTimeout': 10000,
        'show': (process.env.BROWSER === 'true') || false,
        "restart": true,
        "width": 1200,
        "height": 1200
    }
  },
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