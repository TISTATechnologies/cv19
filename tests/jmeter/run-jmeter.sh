#!/usr/bin/env bash
###############################################################################
# Helper script to start jmeter from a terminal with the specific configuration file
###############################################################################
echoerr() { echo $@ >&2; }

host_from_url() { sed 's/https:\/\///g' | sed 's/http:\/\///g' | cut -d'/' -f1 | sed 's/\/$//g'; }

load_config() {
    # bamboo_APP_URL, bamboo_REACT_APP_COVID_DATA_URL, REACT_APP_COMMON_DATA_URL
    load_env="../../scripts/load.env"
    if [ ! -f "${load_env}" ]; then
        echoerr "File ${load_env} not found. Skip execution."
    else
        prj_root_dir="../.."
        . ${load_env} "${prj_root_dir}"
    fi
    # yesterday=$(date -r $(( $(date '+%s') - 86400 )) +"%Y%m%d")
    app_server=$(echo "${APP_URL:-"$bamboo_APP_URL"}" | host_from_url)
    api_covid_server=$(echo "${REACT_APP_COVID_DATA_URL:-"$bamboo_REACT_APP_COVID_DATA_URL"}" | host_from_url)
    api_common_server=$(echo "${REACT_APP_COMMON_DATA_URL:-"$$bamboo_REACT_APP_COMMON_DATA_URL"}" | host_from_url)

    jmeter_app=/opt/apache-jmeter/bin/jmeter
    if [ ! -f "${jmeter_app}" ]; then jmeter_app="${PWD}/apache-jmeter/bin/jmeter"; fi
    if [ ! -f "${jmeter_app}" ]; then
        echoerr "Error: jmeter not found."
        echoerr "Please install jmeter into the '${PWD}/apache-jmeter' or into the '/opt/apache-jmeter' directory"
        return 1
    fi
    export JMETER_APP=${jmeter_app}
    export JMETER_FILE=${1:-"${JMETER_FILE:-"${bamboo_JMETER_FILE}"}"}
    export JMETER_THRESHOLD=${JMETER_THRESHOLD:-"10"}               # Allowed errors percentage
    export APP_HOST=$(echo "${app_server}:" | cut -d":" -f1)
    export APP_PORT=$(echo "${app_server}:" | cut -d":" -f2)
    export API_COVID_HOST=$(echo "${api_covid_server}:" | cut -d":" -f1)
    export API_COVID_PORT=$(echo "${api_covid_server}:" | cut -d":" -f2)
    export API_COVID_PATH=/covid/v1
    export API_COMMON_HOST=$(echo "${api_common_server}:" | cut -d":" -f1)
    export API_COMMON_PORT=$(echo "${api_common_server}:" | cut -d":" -f2)
    export API_COMMON_PATH=/common/v1
    export VUSERS=${VUSERS:-"${bamboo_VUSERS:-"5"}"}
    export OUTPUT="${PWD}/output"

    echo ""
    echo "-- [JMeter parameters ] ------------------------------------------------"
    echo "JMETER APP        : ${JMETER_APP}"
    echo "JMETER_FILE       : ${JMETER_FILE}"
    echo "JMETER_THRESHOLD  : ${JMETER_THRESHOLD}"
    echo "APP_HOST          : ${APP_HOST} (APP_PORT: ${APP_PORT:-"empty"})"
    echo "API_COVID_HOST    : ${API_COVID_HOST} (API_COVID_PORT: ${API_COVID_PORT:-"empty"})"
    echo "API_COVID_PATH    : ${API_COVID_PATH}"
    echo "API_COMMON_HOST   : ${API_COMMON_HOST} (API_COMMON_PORT: ${API_COMMON_PORT:-"empty"})"
    echo "API_COMMON_PATH   : ${API_COMMON_PATH}"
    echo "VUSERS            : ${VUSERS}"
    echo "OUTPUT            : ${OUTPUT}"
    
}

open_jmeter_gui() {
    load_config ${1} || return 1
    "${JMETER_APP}" -t "${JMETER_FILE}" &
}

start_jmeter_test() {
    echo "Start ${0} script"
    load_config ${1} || return 1
    rm -rf "${OUTPUT:-"null"}"
    mkdir "${OUTPUT}" 2>/dev/null
    echo ""
    echo "--[ JMeter is running ]-------------------------------------------------"
    time "${JMETER_APP}" -n -t "${JMETER_FILE}" -l "${OUTPUT}/jmeter.log" \
        -e -Jserver.rmi.ssl.disable=true -o "${OUTPUT}" \
    && echo "--[ Done ]-----------------------------------------------------------"
    cat "${OUTPUT}/jmeter.log" || exit 1
    
    echo "------------------------------------------------------------------------"
    echo "Total result from the ${OUTPUT}/statistics.json:"
    cat "${OUTPUT}/statistics.json" | jq -r ".Total"
    errorPctStr=$(cat "${OUTPUT}/statistics.json" | jq -r ".Total.errorPct")
    errorPct=$(echo "$errorPctStr" | cut -d'.' -f1)
    errorPct=$(( ${errorPct} + 0))
    echo "--[ JMeter finished ]---------------------------------------------------"
    echo "Log file         : file://${OUTPUT}/jmeter.log"
    echo "Result dashboard : file://${OUTPUT}/index.html"
    if [ ${errorPct} -gt ${JMETER_THRESHOLD:-10} ]; then
        echoerr "Error: complete with ${errorPctStr}% errors."
        return 1
    fi
    if [ "${errorPctStr}" == "0" ]; then
        echo "Complete without errors."
        return 0
    fi
    echo "Complete with ${errorPctStr}% errors."
}

# =============================================================================
cd $(dirname "${0}")
wd=${PWD}
DEF_CONFIG=$(ls *.jmx | head -n 1)

if [ "${1}" == "gui" ]; then
    open_jmeter_gui "${2:-"${DEF_CONFIG}"}"
else
    start_jmeter_test "${1:-"${DEF_CONFIG}"}" || exit 1
fi
