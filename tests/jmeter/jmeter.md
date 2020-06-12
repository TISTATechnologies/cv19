
## Setup

1. Download JMeter from the main site: https://jmeter.apache.org/download_jmeter.cgi
2. Unpack it into the ./tools/jmeter/apache-jmeter directory
3. Download and unpack Custom JMeter Function plugin: https://jmeter-plugins.org/?search=jpgc-functions

Commands in terminal to setup everything automatically:
```bash
cd ./tests/jmeter
curl -s "https://apache.claz.org//jmeter/binaries/apache-jmeter-5.2.1.tgz" \
| tar xzv -C ./ \
&& mv apache-jmeter-* apache-jmeter \
&& curl -s "https://jmeter-plugins.org/files/packages/jpgc-functions-2.1.zip" > jpgc-functions.zip \
&& unzip jpgc-functions.zip -d ./apache-jmeter \
&& echo "Apache JMeter installed into the ${PWD}/apache-jmeter directory" \
&& ./apache-jmeter/bin/jmeter --version
```

## Launch

Gui mode (you need it mostly to create a test workflow):
```bash
./run-jmeter.sh gui
```

Run cv19 tests:
```bash
./run-jmeter.sh
# or 
VUSERS=10 ./run-jmeter.sh
```
System environemnt for the script:
* JMETER_FILE - jmeter file (default: cv19-demo-tests.jmx)
* VUSERS - how many virtual users will be used

## Plugins ???

* https://jmeter-plugins.org/wiki/ConcurrencyThreadGroup/
* https://github.com/Blazemeter/jmeter-bzm-plugins/blob/master/random-csv-data-set/RandomCSVDataSetConfig.md

## Links
https://medium.com/@kalyani1729mittapalli/load-testing-using-concurrency-thread-group-in-apache-jmeter-63388ac3ec17
