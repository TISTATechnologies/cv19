#!/usr/bin/env bash
###############################################################################
show_help() {
    echo "Usage: run-multiple-tests <api|webapp|all> <process count> <zips count>"
    echo "Options:"
    echo "  api             - make tests on api level only"
    echo "  webapp          - make tests on webapp level only"
    echo "  all             - make tests on both api and webapp levels"
    echo "  <process count> - count of instances in parallel (VUsers). (default: 5)"
    echo "  <zips count>    - count of random zips in the tests. (default: 50)"
    exit 1
}

title() {
    echo "======================================================================"
    echo $@
}

random_delay() { delay=$(( RANDOM % ${1:-"20"} )); echo "Wait ${delay} sec."; sleep ${delay}; }

test_api() {
    local id=${1}
    echo "[API-${id}] Start tests in ${PWD}"
    npm run test:api
    local errcode=$?
    echo "[API-${id}}] End tests: errcode=${errcode}"
}

test_webapp() {
    local id=${1}
    echo "[WEBAPP-${id}] Start tests in ${PWD}"
    npm run test:webapp -- --verbose
    local errcode=$?
    echo "[WEBAPP-${id}}] End tests: errcode=${errcode}"
}

run_tests() {
    type=${1}
    count=${2}
    dt=$(date +"%Y%m%d-%H%M%S")
    log_dir=${3}/logs/${dt}

    mkdir -p "${log_dir}" 2>/dev/null
    title "Start ${count} tests inside the ${PWD} project"
    echo "Logs: ${log_dir}"
    
    for i in $(seq 1 ${count}); do
        id=$(printf "%05s" ${i})
        app_log=${log_dir}/api-${id}-test.log
        webapp_log=${log_dir}/webapi-${id}-test.log
        # Start scripts in the background (asynchroniously)
        case "${type}" in
            api)
                (test_api "${id}" 2>&1 | tee "${app_log}") &
                ;;
            webapp)
                (test_webapp "${id}" 2>&1 | tee "${webapp_log}") &
                ;;
            all)
                (test_api "${id}" 2>&1 | tee "${app_log}") &
                (test_webapp "${id}" 2>&1 | tee "${webapp_log}") &
                ;;
            *) echo "Error: incorrect type '${type}'"; return 1
        esac
    done
    wait
    title "Done execution tests."
    statfile=${log_dir}/stat.txt
    grep "End tests" ${log_dir}/*.log > "${statfile}"
    title ">>> Success results"
    grep "errcode=0" "${statfile}"
    title ">>> Error results"
    grep -v "errcode=0" "${statfile}"
}

###############################################################################
cd $(dirname "${0}")/..
type=${1:-"--help"}
COUNT=${2:-"5"}
export ZIPS_COUNT=${3:-"${ZIPS_COUNT:-"50"}"}

case "${type}" in
    help|--help)    show_help;;
    all|api|webapp) ;;
    *) echo "Error: unknown type '${type}'."; exit 1;;
esac
title "Generate cache files for tests first"
npm run generate
title "Testing (zips: ${ZIPS_COUNT}, threads=${COUNT})...."
run_tests ${type} ${COUNT} "${PWD}/output"
title "Done"