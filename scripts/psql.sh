#!/usr/bin/env bash
. $(dirname "${0}")/load.env
echo "Connection string is postres://${PGUSER}:****@${PGHOST}:${PGPORT}/${PGDATABASE}?schema=${PGSCHEMA}"
psql -h "${PGHOST}" -p ${PGPORT} -U "${PGUSER}" "${PGDATABASE}" $@
