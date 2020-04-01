#!/usr/bin/env bash
cd $(dirname "${0}")
./apache-jmeter/bin/jmeter -t ./cv19-demo-tests.jmx &