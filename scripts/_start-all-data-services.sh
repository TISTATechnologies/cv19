#!/usr/bin/env bash
cd "$(dirname "${0}")/.."

wd=${PWD}
if [ -d "${wd}/build" ]; then
    echo "Clean all previous data in ${wd}/build..."
    rm  -rf "${wd}/build"
fi

profile=
case "${1}" in
    profile|--profile)
        profile=${2}
        if [ -z "${profile}" ]; then show_help; fi
        export CV19_ENV="${profile}"
        shift
        shift
        ;;
esac
. "${wd}/scripts/load.env"

"${wd}/scripts/start-pull-data-services.sh" $@ || exit 1
"${wd}/scripts/start-export-data-services.sh" $@ || exit 1
"${wd}/scripts/upload-covid-data-to-s3-bucket.sh" $@ || exit 1
