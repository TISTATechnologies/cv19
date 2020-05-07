#!/usr/bin/env bash
cd $(dirname "${0}")
./start-pull-data-services.sh $@ && \
./start-export-data-services $@
