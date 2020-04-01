#!/usr/bin/env bash
cd $(dirname "${0}")/..
wd=${PWD}
arg1=${1:-"update"}
cd ./data/covid-database/
./migrate-db.sh ${arg1}
cd ${wd}