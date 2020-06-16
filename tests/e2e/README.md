# End-to-End tests for Covid-12 Tracker Application

The UI e2e tests are based on the [CodeceptJS](https://github.com/codeception/codeceptjs/) + [Selenium](https://www.selenium.dev/).

## Before each tests

1. Please configure your project with using a ```.env``` file. See *Development - Configuration* section on the main [README.md](../../README.md) file.
2. Generate static data from the database: ```cd tests/e2e && npm run generate```

## Local Selenium server

### Start Selenium server locally
```bash
# Install required libraries first
npm run selenium:install-locally
# Start selemium with Chrome
npm run selenium:start-locally
```

### Start Selenium server locally with docker
```bash
npm run selenium:start-docker
```

## Tests for Web Application

Simple test UI with the local Selenium Server
```bash
npm run test:webapp
ZIPS=20850,20147 npm run test:webapp
ZIPS_COUNT=25 npm run test:webapp
```

If you want to test with the remote Selenium Test use a system variable for that
```bash
SELENIUM_SERVER=<selenium host address>:4444 npm run test:webapp
```

If you want to see a browser
```bash
HEADLESS=false ZIPS=20850 npm run test:webapp
```

If you want to see more details
```bash
npm run test:webapp -- --verbose
```

## Tests for API

```bash
npm run test:api
ZIPS=20850,20147 npm run test:api
ZIPS_COUNT=25 npm run test:api
```

## System environment for tests

* All System Environment from the .env file
* **ZIPS** - you can specify comma separate list with zips to test
* **ZIP_COUNT** - how many random zips will be used in the test (default: 10)
* **SELENIUM_SERVER** - you can specify an address to the remote selenium server
