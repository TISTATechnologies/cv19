#!/usr/bin/env bash
# #############################################################################
# Helper script to run all sql scripts in order from the init or update directories
# Usage: migrate-db <init|update|refresh-data|help>
# #############################################################################

start_migration() {
    cd "$(dirname "$0")/../.."
    prg_dir=${PWD}
    . ./scripts/load.env
    echo ""
    echo "Database settings: postres://${PGUSER}:****@${PGHOST}:${PGPORT}/${PGDATABASE}?schema=${PGSCHEMA}"
}

end_migration() {
    echo "Complete"
}

execute_sql_file() {
    echo "============================================================"
    echo ">>> Execute ${1} script..."
    "${prg_dir}/data/covid-database/psql.sh" -f "${1}" 2>&1 | grep -v "Load " | grep -v "Config: " || exit 1
}

process_sql_files_from_dir() {
    cd ${1}
    ls *.sql | while read f; do execute_sql_file "${f}"; done
    cd - >/dev/null
}

init_new_db() {
    echo "The database will be reinitialized (cleaned and recreated)."
    echo "************************************************************"
    echo "*     WARNING: data in the database will be deleted!!!     *"
    echo "************************************************************"
    read -p "Continue to recreate a Database (yes/No)? " opt
    if [ "${opt}" != "yes" ]; then echo "Skip"; exit 1; fi
    process_sql_files_from_dir ./data/covid-database/init
    yes yes | update_db
}

update_db() {
    echo "The database will be updated."
    read -p "Continue update a Database (yes/No)? " opt
    if [ "${opt}" != "yes" ]; then echo "Skip"; exit 1; fi
    process_sql_files_from_dir ./data/covid-database/update
    yes yes | refrest_data
}

refrest_data() {
    echo "The data in the database will be refreshed (materialized view and etc.)."
    read -p "Continue this process (yes/No)? " opt
    if [ "${opt}" != "yes" ]; then echo "Skip"; exit 1; fi
    cd ./data/covid-database/update
    execute_sql_file "./80-refresh-materialized-view.sql" || exit 1
    cd - >/dev/null
}

arg=${1:-"--help"}
case "${arg}" in
    update) start_migration && update_db && end_migration;;
    init|create) start_migration && init_new_db && end_migration ;;
    refresh-data) start_migration && refrest_data && end_migration;;
    help|--help)
        echo "Usage: $(basename "${0}") <init|update|refresh-data>"
        echo "Commands:"
        echo "  init         - Initialize a new database (./init/*.sql)"
        echo "  update       - Update existed database (./update/*.sql)"
        echo "  refresh-data - Refresh all materialized view in database"
        exit 1;;
    *) echo "Error: unknown '${arg}' command."; exit 1;;
esac
