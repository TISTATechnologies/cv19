# Tista COVID-19 portal

* [Environment](#environment)
* [Requirements](#requirements)
* [Build and deploy](#build-and-deploy)
* [Development](#development)
* [Notes](#notes)
    - [Setup JWT on Postgrest](#setup-jwt-on-postgrest)

## Environment


### Production environment

| Name        | Url                                                       |
| ----------- | --------------------------------------------------------- |
| WebApp      | https://innovation.tistatech.com ([direct link](http://innovation.tistatech.com.s3-website.us-east-1.amazonaws.com/)) |
| S3 Bucket   | innovation.tistatech.com |
| API         | https://api-prod-pgt.tistatech.com/ |


### Demo environment
| Name        | Url                                                       |
| ----------- | --------------------------------------------------------- |
| WebApp      | https://innovation-demo.tistatech.com ([direct link](http://innovation-demo.tistatech.com.s3-website.us-east-1.amazonaws.com/)) |
| S3 Bucket   | innovation-demo.tistatech.com |
| API         | https://api-demo-pgt.tistatech.com/ ([direct link](http://18.232.212.26:3000/)) |
| Database    | postres://18.232.212.26:5433/postgres?schema=api |


### Dev environment
| Name        | Url                                                       |
| ----------- | --------------------------------------------------------- |
| Source code | git-codecommit.us-east-1.amazonaws.com/v1/repos/cv19 |
| WebApp      | https://innovation-dev.tistatech.com ([direct link](http://innovation-dev.tistatech.com.s3-website.us-east-1.amazonaws.com/)) |
| S3 Bucket   | innovation-dev.tistatech.com |
| API         | https://api-dev-pgt.tistatech.com:444/ ([direct link](http://18.232.212.26:3001/)) |
| Database    | postres://18.232.212.26:5433/postgres?schema=apidev |


### Requirements:

1. Nodejs 12+
1. Python 3.8+
1. Postgres Client 10+
1. Python packages:
     * pyjwt
     * psycopg2
     * python-dotenv
     * requests
     * additionally on CentOS: ```sudo yum install python3-psycopg2```


## Build and deploy

Before build and deploy, you need to specify configuration using system environment variables or specify ```.env``` file 
at the root project's level. 

Please look into the ```.env.sample``` for details.

### Configuration

We can create ```cv19.xxx.conf``` configuration file from the ```.env.sample``` and 
after that this configuration file can be loaded with a system environment variable ```CV19_ENV=xxx```.

### Build and deploy WebApp

```
./scripts/_build-and-deploy-webapp.sh
```
This script will install all requirements packages for WebApp, build React application and deploy it to the S3 bucket.

You can specify a configuration and call this script:
```
CV19_ENV=dev ./scripts/_build-and-deploy-webapp.sh
```


### Update dtabase

To update a database use a command:
```
./scripts/_migrate_database.sh
CV19_ENV=dev ./scripts/_migrate_database.sh
```

## Collect data using services

To collect current data: ```./scripts/_start-all-pull-data-services.sh```
To collect all data: ```./scripts/_start-all-pull-data-services.sh all```
To collect data on specific day: ```./scripts/_start-all-pull-data-services.sh YYYY-MM-DD```

You can specify a configuration using a configuration files inside home directory: ~/cv19.dev.conf, ~/cv19.demo.conf, ~/cv19.prod.conf.
To collect data and use a configuratio file:
* ~/cv19.dev.conf: ```./scripts/_start-all-pull-data-services.sh --profile dev```
* ~/cv19.demo.conf: ```./scripts/_start-all-pull-data-services.sh --profile demo```
* ~/cv19.prod.conf: ```./scripts/_start-all-pull-data-services.sh --profile prod```
* We can use environment CV19_ENV for that too: ```CV19_ENV=dev ./scripts/_start-all-pull-data-services.sh```


## Development

We are using [AWS Codecommit](https://aws.amazon.com/codecommit/) to store source code 
([How to connect](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-connect.html)).

> Use need to use AWS User Key ID insted of username (example: ACKA3FDXXSAFYXXX5J5Y).

Get source code:
```bash
git clone ssh://git-codecommit.us-east-1.amazonaws.com/v1/repos/cv19
```

Code structure:
* ```data``` - contains scripts and tools to create/update Postgresql database
    - ```covid-database``` - sql script to initialize and update database
    - ```datasets``` - scripts, notes how to create static data for database: states, countries, counties, population, and etc.
    - ```schemaspy``` - tool to generate database documentation
* ```scripts``` - devops and helper scripts for project
* ```services``` - contains code to download/analyze/stora data
* ```webapp``` - source code of a Web Application based on React

### Data Layer

We are using Postgresql Database to store data.

We are using a couple of public datasets to fill database. Please look into the ```data/datasets``` directory for details.

### API Layer

To provide RESTfull API access to data in the database we are using [postrest](http://postgrest.org/en/v6.0/).

See a Postrest documentation [here](http://postgrest.org/en/v6.0/api.html) for API schema.

Common requests which you can use
* Get all states:
```
https://api-server/state
```
* Get covid data for US state level only on Apr 3 2020:
```
https://api-server/covid_data_stat?country_id=eq.US&date=eq.2020-04-03&location_type=eq.state&order=fips
```
* Get covid data on 2020-03-28 with zip code 20850:
```
https://api-server/covid_data_stat_with_zip?zip=eq.20850&date=eq.2020-03-28
```
* Check status of the last datasets:
```
https://api-server/_log?message=like.*added*&order=id.desc&limit=20
```

### Service Layer

Bash and Python scripts are using to collect and analize data in the ```services``` directory.

### Appication Layer

AWS S3 bucket is used to host static site written on React.js.

## Notes

### Setup JWT on Postgrest

You can file a full documentation how to setup security on Postgrest Service [here](http://postgrest.org/en/v6.0/tutorials/tut1.html)

To add an ability to work with Postgrest service with JWT token you need:
1. Create a specific role in DB
```sql
-- Creating a role for authorized user, ex: api_user ---
create role api_user nologin;
grant api_user to dev_anon;
-- Grant permission for created role to the all tables and view in schema
GRANT SELECT ON ALL TABLES IN SCHEMA apidev TO api_user;
```
2. Generate secret which you will use to encrypt JWT token
```bash
# On Linux system you can use something like:
LC_CTYPE=C < /dev/urandom tr -dc A-Za-z0-9 | head -c32; echo ""
```
3. Generate JWT token by secret from the step 2.
```bash
./scripts/generate-jwt-for-postgrest.py <JWT Secret KEy> <db group>
```
Example:
```bash
./scripts/generate-jwt-for-postgrest.py dDqPAZHtVhC13ic0U9cDu8 api_user
```
You can generate JWT Secret and JWT token with default group 'api_user':
```bash
./scripts/generate-jwt-for-postgrest.py
```
Result will be like:
```json
Generate JWT token which can be used with postgrest api.
Payload : {'role': 'api_user'}
Secret  : U6pLIHUrWJyESSDVuusaLODrKg0hzsBPNM5j5ULoS-U
JWTToken:  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2x...
```
4. Don't forget to restrict a group in DB that you are using for anonymous access 
which you are provided in postgrest.conf file.
5. Now you need to specify an HTTP Header ```Authorization=Bearer Bearer <JWT token>``` 
for all requests to the Postgrest API.
