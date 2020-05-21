#!/usr/bin/env bash
cd $(dirname "${0}")
wd=${PWD}
"${wd}/start-pull-data-services.sh" $@ || exit 1
"${wd}/start-export-data-services.sh" $@ || exit 1
