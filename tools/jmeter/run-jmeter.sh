#!/usr/bin/env bash
###############################################################################
# Helper script to start jmeter from terminal with the specific configuration file
###############################################################################
cd $(dirname "${0}")
wd=${PWD}

jmeter_app=/opt/apache-jmeter/bin/jmeter
if [ ! -f "${jmeter_app}" ]; then jmeter_app="${PWD}/apache-jmeter/bin/jmeter"; fi
if [ ! -f "${jmeter_app}" ]; then
    echo "Error: jmeter not found."
    echo "Please install jmeter in '${PWD}/apache-jmeter' or in '/opt/apache-jmeter'"
    exit 1
fi

. ./load-jmeter.env
cd ${wd}
echo "JMETER APP        : ${jmeter_app}"

if [ "${1}" == "gui" ]; then
    "${jmeter_app}" -t "${JMETER_FILE}" &
else
    rm -rf "${OUTPUT:-"null"}"
    mkdir "${OUTPUT}" 2>/dev/null
    echo ""
    echo "--[ Start ]-------------------------------------------------------------"
    time "${jmeter_app}" -n -t "${JMETER_FILE}" \
        -e -Jserver.rmi.ssl.disable=true \
        -l "${OUTPUT}/jmeter.log" \
        -o "${OUTPUT}" \
    && echo "--[ Done ]-----------------------------------------------------------" \
    && cat "${OUTPUT}/jmeter.log" \
    && echo "---------------------------------------------------------------------" \
    && echo "Result dashboard: file://${OUTPUT}/index.html"
fi
