#!/usr/bin/env bash
###############################################################################
# Check if all special location fips have Covid-19 data
###############################################################################
APP_URL=${APP_URL:-"https://covid19-internal.tistatech.com"}
COVID_DATA_URL=${COVID_DATA_URL:-"https://data.tistatech.com/covid/v1"}

url="${APP_URL}/data/special-locations.json"
yesterday=$(date -d "1 days ago" +"%Y-%m-%d")
errors=0
echo "Download special locations FIPS from the ${url} url"
for fips in $(curl -skL "${url}" | jq -r ".[].fips" | sort -u); do
    data_url="${COVID_DATA_URL}/daily/latest/us/${fips:0:2}/${fips}.json"
    date=$(curl -skL "${data_url}" | jq -r ".[].date")
    if [ "${date}" != "${yesterday}" ]; then
        errors=$((${errors} + 1))
        echo "[ERR] fips=${fips}, date=error (actual=${date}, expected=${yesterday})" >&2
    else
        echo "[OK ] fips=${fips}, date=${date}"
    fi
done
if [ ${errors} -ne 0 ]; then
    echo "[ERR] Data not found for ${errors} fips." 1>&2
    exit ${errors}
else
    echo "[OK] Data not found for ${errors} fips."
    exit 0
fi