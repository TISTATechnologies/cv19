#!/usr/bin/env bash
# #############################################################################
# Launch psql with the configuration from the system environment and/or .env file
# Usage: psql.sh
#        psql.sh -f <sql script>
# #############################################################################
wd="$(dirname "${0}")/../.."
. "${wd}/scripts/load.env" "${wd}" || exit 1
echo "Connection string is postres://${PGUSER}:****@${PGHOST}:${PGPORT}/${PGDATABASE}?schema=${PGSCHEMA}"
echo "Command line: psql -h \"${PGHOST}\" -p ${PGPORT} -U \"${PGUSER}\" \"${PGDATABASE}\" $@"
if [ "${1}" == '-f' ] && [ -n "${2}" ]; then
    psql -h "${PGHOST}" -p ${PGPORT} -U "${PGUSER}" -f ${2} "${PGDATABASE}"
else
    psql -h "${PGHOST}" -p ${PGPORT} -U "${PGUSER}" "${PGDATABASE}" $@
fi
