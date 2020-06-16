#!/bin/sh
# #############################################################################
# Helper script to create database documentation.
# The result documentation will be inside the renerated static web pages.
# Default output directory: <project directory>/build/db-schema
# 
# Requirements:
# wget "https://github.com/schemaspy/schemaspy/releases/download/v6.1.0/schemaspy-6.1.0.jar"
# wget "https://jdbc.postgresql.org/download/postgresql-9.4.1208.jre6.jar"
#
# #############################################################################
config=$(dirname "${0}")/../../.env
echo "Load config from ${config}"
export $(grep ^[A-Z] "${config}" | xargs)

cd "$(dirname "${0}")"
output=../../build/db-schema
rm -rf "${output}"
mkdir -p "${output}" 2>/dev/null

schema=
if [ -n "${PGSCHEMA}" ]; then
    schema="-s ${PGSCHEMA}"
fi
echo "Create database schema: postgres://${PGUSER}:*****@${PGHOST}:${PGPORT}/${PGDATABASE}"
echo "Output directory ${output}"
java -jar ./schemaspy-6.1.0.jar \
    -dp ./postgresql-9.4.1208.jre6.jar \
    -t pgsql -host "${PGHOST}" -port ${PGPORT} \
    -db "${PGDATABASE}" -u "${PGUSER}" -p "${PGPASSWORD}" ${schema} \
    -o "${output}" || exit 1
echo "Success. Try to open ${output}/index.html in your default browser."
open "${output}/index.html"
