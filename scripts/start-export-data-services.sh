#!/usr/bin/env bash
###############################################################################
# Helper script, see 'show_help' method for details
###############################################################################
show_help() {
    echo "Start all services to export data from all sources."
    echo "Usage: $(basename "${0}") [--profile dev/demo/prod] [YYYY-MM-DD|latest]"
    echo ""
    echo "If a date is not specified the collectors will load latest data"
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
output_dir="${PWD}/build/covid"
period=${1:-"latest"}

title "Start all services to export data (profile=${profile:-".env"})"
echo "Period: ${period}"
echo "Output: ${output_dir}"
read -p "Continue to export data (y/N)? " opt
if [ "${opt}" != "y" ]; then echo "Skip"; exit 1; fi

cd data/services/cv19srv
title "Export all covid data" && \
python3 cv19srv export all "${period}" "${output_dir}" $@ && \
cd - >/dev/null && \
echo "Success"
