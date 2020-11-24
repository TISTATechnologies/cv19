#!/usr/bin/env bash
###############################################################################
# Helper script, see 'show_help' method for details
###############################################################################
TEMP=${TEMP:-"${TMP:-"${TMPDIR:-"$(dirname "$(mktemp -d -u)")"}"}"}

show_help() {
    echo "Start services to collect data from all sources."
    echo "Usage: $(basename "${0}") [--profile dev/demo/prod] [YYYY-MM-DD|all]"
    echo ""
    echo "If a date is not specified the collectors will load yesterday's data"
    echo ""
    echo "Profile is using to specify which configuration file will be loading:"
    echo " ~/cv19.dev.conf"
    echo " ~/cv19.demo.conf"
    echo " ~/cv19.prod.conf"
    echo ""
    echo "You can specify all configuration values in the system environment variables instead of using configuration file"
    echo "Use 'FAST_COLLECTION=true' to prevent update materialize view in DB and do not collect executive orders"
    exit 1
}

title() {
    echo "======================================================================"
    echo " $@"
    echo "======================================================================"
}

collect_executive_news() {
    title "Pull executive news links"
    if [ "${FAST_COLLECTION}" == "true" ]; then echo "Skip pull executive orders (FAST_COLLECTION=true)";
    else python3 cv19srv collect executive-news $@ 2>&1; fi
}

refresh_database() {
    title "Refresh data in the database"
    if [ "${FAST_COLLECTION}" == "true" ]; then echo "Skip refresh database (FAST_COLLECTION=true)";
    else yes yes | ./data/covid-database/migrate-db.sh refresh-data 2>&1; fi
}

cd "$(dirname "${0}")/.."

profile=
case "${1}" in
    help|--help) show_help;;
    profile|--profile)
        profile=${2}
        if [ -z "${profile}" ]; then show_help; fi
        export CV19_ENV="${profile}"
        shift
        shift
        ;;
esac
. ./scripts/load.env || exit 1

title "Start all services to pull new data (profile=${profile:-".env"})"
read -p "Continue to load data (y/N)? " opt
if [ "${opt}" != "y" ]; then echo "Skip"; exit 1; fi

mkdir -p "${TEMP}" >/dev/null
LOG_FILE="${TEMP}/cv19-pull-all-data-${1:-"latest"}.log"

echo "Log file: ${LOG_FILE}"
rm -f "${LOG_FILE}"

cd data/services/cv19srv
title "Check database status" | tee -a "${LOG_FILE}" && \
python3 cv19srv check-database 2>&1 | tee -a "${LOG_FILE}" && \
collect_executive_news $@ | tee -a "${LOG_FILE}" && \
title "Pull data from the JHU dataset" | tee -a "${LOG_FILE}" && \
python3 cv19srv collect jhu $@ 2>&1 | tee -a "${LOG_FILE}" && \
title "Pull data from the CovidTracking dataset" | tee -a "${LOG_FILE}" && \
python3 cv19srv collect covidtracking $@ 2>&1 | tee -a "${LOG_FILE}" && \
title "Calculate data for the custom areas" | tee -a "${LOG_FILE}" && \
python3 cv19srv collect custom-areas $@ 2>&1 | tee -a "${LOG_FILE}" && \
cd - >/dev/null && \
refresh_database | tee -a "${LOG_FILE}" && \
echo "Log file: ${LOG_FILE}" | tee -a "${LOG_FILE}" && \
echo "Success" | tee -a "${LOG_FILE}"
