# End-to-End tests


## E2E Tests for WebApp

Tool: https://github.com/codeception/codeceptjs/

```bash
npm run test:webapp
ZIPS=20850,20147 npm run test:webapp
ZIPS_COUNT=25 npm run test:webapp
```

## E2E Tests for API

```bash
npm run test:api
ZIPS=20850,20147 npm run test:api
ZIPS_COUNT=25 npm run test:api
```

## System environment for tests

* All System Environment from the .env file
* **ZIPS** - you can specify comma separate list with zips to test
* **ZIP_COUNT** - how many random zips will be used in the test (default: 10)
