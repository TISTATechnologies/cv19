#!/usr/bin/env bash
cd $(dirname "${0}")
wd=${PWD}
cd ../../
. ./scripts/load.env
cd ${wd}

jmeter_file=./cv19-demo-tests.jmx
output=output
result_file=${output}/jmeter.log

yesterday=$(date -r $(( $(date '+%s') - 86400 )) +"%Y-%m-%d")
export APP_SERVER=$(echo "${APP_URL}" | sed 's/https:\/\///g' | sed 's/http:\/\///g' | sed 's/\///g')
export API_SERVER=$(echo "${REACT_APP_SERVER_URL}" | sed 's/https:\/\///g' | sed 's/http:\/\///g' | sed 's/\///g')
export API_JWT="${REACT_APP_JWT_TOKEN}"
export ZIP=${1:-"20850"}
export DATE=${2:-"${yesterday}"}
export VUSERS=${VUSERS:-"5"}

echo "--[ Start ]-------------------------------------------------------------"
echo "Starte JMeter tests with ${jmeter_file} file"
echo "Output directory is ${output}"
echo "API Server: ${API_SERVER}"
echo "WebApp URL: ${APP_SERVER}"
echo "Date      : ${DATE}"
echo "Zip       : ${ZIP}"
echo "VUsers    : ${VUSERS}"

rm -rf "${output}"
mkdir "${output}" 2>/dev/null
echo ""

time ./apache-jmeter/bin/jmeter -n -t "${jmeter_file}" \
    -e -Jserver.rmi.ssl.disable=true \
    -l "${result_file}" \
    -o "${output}" \
&& echo "--[ Done ]-----------------------------------------------------------" \
&& cat "${result_file}" \
&& echo "---------------------------------------------------------------------" \
&& echo "Result dashboard: file://${PWD}/${output}/index.html"
