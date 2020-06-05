# Tista COVID-19 tracker

* [Environment](#environment)
* [Requirements](#requirements)
* [Release/Deploy](#release)
* [Development](#development)
    - [Configuration](#configuration)
    - [Collect data](#collect-data)
    - [Export data](#export-data)
* [Testing](#testing)
    - [e2e](#e2e-testing)
    - [jmeter](#jmeter)
* [Notes](#notes)
    - [Setup JWT on Postgrest](#setup-jwt-on-postgrest)

## Environment

* **Postgresql** - stores all collected Covid-19 data (closed for public).
* **AWS S3 buckets** - hosts a Covid-19 Tracker Web Application and all generated files with data.

### Databases

|           | PROD/DEMO                     | DEV                           |
| --------- | ----------------------------- | ----------------------------- |
| Host      | 18.232.212.26 (172.16.0.4)    | 18.232.212.26 (172.16.0.4)    |
| Port      | 5433                          | 5433                          |
| Database  | postgres                      | postgres                      |
| Schema    | api                           | apidev                        |
| Username  | authenticator                 | <developer specific>          |

### AWS S3 Buckets

#### data.tistatech.com
* [common/v1](https://data.tistatech.com/common/v1/index.html) - all public Tista data (countries, states, counties, population, and etc. information)
* [covid/v1](https://data.tistatech.com/covid/v1/index.html) - Covid-19 related data

### Covid-19 Tracker Application Web servers

All Web server which are hosting Covid-19 Tracker Web Aplplication are hosted on AWS S3 buckets.

* **https://covid19.tistatech.com** - Main public server.
    - https://covid19-a.tistatech.com - server for blue/green deployment.
    - https://covid19-b.tistatech.com - server for blue/green deployment.
* **https://covid19-internal.tistatech.com** - Public server with a Tista employees specific functionality.
    - https://covid19-internal-a.tistatech.com - server for blue/green deployment.
    - https://covid19-internal-b.tistatech.com - server for blue/green deployment.
* **https://covid19-demo.tistatech.com** - Demo server, allowd for DEV Team only (Updated manually fro the **develop** branch).
* **https://covid19-dev.tistatech.com** - DEV server, allowd for DEV Team only (Updated automatically from the **develop** branch).


## Requirements:

1. Nodejs 12+
1. Postgres Client 10+
1. Python 3.8+
1. Python packages:
     * ```pip3 install pyjwt --user```
     * ```pip3 install psycopg2 --user``` or ```pip3 install psycopg2-binary --user``` or ```sudo yum/apt install python3-psycopg2```
     * ```pip3 install python-dotenv --user```
     * ```pip3 install requests --user```
     * ```pip3 install unidecode --user```
     * ```pip3 install bs4 --user```
1. awscli

## Release

1. Freeze all future changes (new functionality or fixes) should be inside the **develop** branch.
2. The **develop** branch should be at the top of the **master** branch
```bash
git checkout master
git pull
git checkout develop
git rebase master
git push origin develop
```
3. Merge all changes from the **develop** branch into the **master** branch. **Don't make a loops with auto merge.**
```bash
git co master
git merge develop
```
4. Push **master** branch to the remote
```bash
git push origin master
```
5. Create new tag with the new version
```bash
git tag <new version>                   # example: git tag 1.5.0
git push origin <new bersion>           # example: git push origin 1.5.0
```
6. Now you are redy to deploy a new release version to the Production.


### Automatic deployment

* For Production use [CV19-Production](http://34.197.134.62:8085/browse/CV19PROD-CV19PROD) build pipeline.
* For Dev/Demo use [CV19-Development](http://34.197.134.62:8085/browse/CV19-CV19) build pipeline.

### Manual build/deploy Web Application

See [Configuration](#configuration) section before manuall deploy.

```bash
cd <project directory>/webapp
npm install && \
npm run build && \
yes | npm run deploy
```
This script will install all requirements packages for WebApp, build React application and deploy it to the S3 bucket.

You can specify a configuration and call this script:
```
export CV19_ENV=dev
cd <project directory>/webapp
npm install && \
npm run build && \
yes | npm run deploy
```

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
* ```lib```     - 
* ```scripts``` - devops and helper scripts for project
* ```tools```
    - ```schemaspy``` - tool to generate database documentation
* ```webapp``` - source code of a Web Application based on React

### Configuration

Before build and deploy, you need to specify configuration using system environment variables or specify ```.env``` file 
at the root project's level. 

Please look into the ```.env.sample``` for details.

We can create ```cv19.xxx.conf``` configuration file from the ```.env.sample``` and 
after that this configuration file can be loaded with a system environment variable ```CV19_ENV=xxx```.

### Create database

```bash
./scripts/_migrate_database.sh init
```

### Collect data

* Collect all latest data: ```./scripts/start-pull-data-services.sh```
* Collect data on the specific date: ```./scripts/start-pull-data-services.sh 2020-04-23```

### Export data

* Export all latest data from database: ```./scripts/start-export-data-services.sh```
* Export data on the specific date from database: ```./scripts/start-export-data-services.sh 2020-04-23```

All exported data will be stored inside the ```./build/covid/``` directory.

Use a command ```./scripts/upload-covid-data-to-s3-bucket.sh``` to deploy all files from ```./build/covid``` to the S3 Bucket.

**NOTE:** Don't forget to remove all data inside the ```./build/``` directory which you are not planning to upload itto the S3 Bucket.


## Testing

### [e2e testing](e2e/README.md)

### [jmeter](tools/jmeter/README.md)


## Notes


### Useful/Helper scripts

#### Collect all data for 90 days
```bash
cd <project dir>
for i in $(seq 90 -1 1); do
    dt=$(date +"%Y-%m-%d" -d "-${i} days")
    echo ""
    echo ""
    echo ""
    echo ""
    echo "==================================================================================="
    echo "|  PROCESSING   ${dt}                                                 |"
    echo "==================================================================================="
    yes | ./scripts/start-pull-data-services.sh ${dt} || exit 1
done
```

#### Export all data for 90 days
```bash
for i in $(seq 90 -1 1); do
    dt=$(date +"%Y-%m-%d" -d "-${i} days")
    yes | ./scripts/start-export-data-services.sh ${dt} || exit 1
done
```

#### Collect latest data and upload it to the S3 Bucket
```bash
rm  -rf ./build
yes | ./scripts/start-pull-data-services.sh \
&& yes | ./scripts/start-export-data-services.sh \
&& yes | ./scripts/upload-covid-data-to-s3-bucket.sh
```

