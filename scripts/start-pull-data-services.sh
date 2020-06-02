#!/usr/bin/env bash
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
    exit 1
}

title() {
    echo "======================================================================"
    echo " $@"
    echo "======================================================================"
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

cd lib/cv19lib
title "Pull executive news links" && \
python3 cv19lib collect executive-news && \
title "Pull data from the CovidTracking dataset" && \
python3 cv19lib collect covidtracking $@ && \
title "Pull data from the JHU dataset" && \
python3 cv19lib collect jhu $@ && \
cd - >/dev/null && \
title "Refresh data in the database" && \
yes yes | ./scripts/_migrate_database.sh refresh-data && \
echo "Success"
