#!/usr/bin/env bash
# #############################################################################
# Launch psql with the configuration from the system environment and/or .env file
# Usage: psql.sh
#        psql.sh -f <sql script>
# #############################################################################
wd="$(dirname "${0}")/../.."
. "${wd}/scripts/load.env" "${wd}" || exit 1
app=pgcli
if ! which ${app} >/dev/null; then app=psql; fi

echo "Connection string is postres://${PGUSER}:****@${PGHOST}:${PGPORT}/${PGDATABASE}?schema=${PGSCHEMA}"
echo "Command line: ${app} -h \"${PGHOST}\" -p ${PGPORT} -U \"${PGUSER}\" \"${PGDATABASE}\" $@"
if [ "${1}" == '-f' ] && [ -n "${2}" ]; then
    cat "${2}" | ${app} -h "${PGHOST}" -p ${PGPORT} -U "${PGUSER}" "${PGDATABASE}"
else
    ${app} -h "${PGHOST}" -p ${PGPORT} -U "${PGUSER}" "${PGDATABASE}" $@
fi
