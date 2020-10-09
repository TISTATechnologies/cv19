#!/usr/bin/env false
# Please use 'bash '
START_DAY='2020-05-01'
TODAY=$(date +"%Y-%m-%d")
echo "########################################################################"
echo "# Special script to work with Covid19 for whole period of time         #"
echo "########################################################################"
cmd=${1:-"help"}
if [ -z "$(echo -e "collect\nexport" | grep ${cmd})" ]; then
    echo "Usage: bash $(basename "${0}") <collect/export>"
    exit 1;
fi

cur_day=${START_DAY}
cmd=${1:-""}
cd "$(dirname "${0}")/.."
wd=${PWD}

echo "Process all days between ${cur_day} and ${TODAY}"
echo "Command: ${cmd}"
read -p "Continue (y/N)? " opt
if [ "${opt:-"n"}" != "y" ]; then echo "Skip"; exit 1; fi
echo "-- Config -----------------------------"
grep -i -v "pass" .env
echo "---------------------------------------"

echo -e "\n!!! WARNING !!!\n"
read -p "All data for this period will be rewritten. Do you want to skip (Y/n)? " opt
if [ "${opt:-"y"}" != "n" ]; then echo "Skip"; exit 1; fi

while [ "${cur_day}" != "${TODAY}" ]; do
    echo "Process ${cur_day} day..."
    #yes | ./scripts/start-export-data-services.sh ${dt} || exit 1
    case "${cmd}" in
        collect)
            echo "Warning: you need to enable command below"
            #yes | ./scripts/start-pull-data-services.sh "${cur_day}" || exit 1

            #cd "${wd}/data/services/cv19srv"
            #python3 cv19srv collect custom-areas ${cur_day} || exit 1
            ;;
        export)
            echo "Warning: you need to enable command below"
            #yes | ${wd}/scripts/start-export-data-services.sh "${cur_day}" || exit 1
            ;;
    esac
    cur_day=$(date +"%Y-%m-%d" -d "${cur_day} + 1 days")
done

if [ "${cmd}" == "collect" ]; then
    yes yes | ${wd}/data/covid-database/migrate-db.sh refresh-data
fi
echo "Done '${cmd}' command"

