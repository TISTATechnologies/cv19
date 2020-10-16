#!/usr/bin/env bash
SCRIPT=./cv19-webapp.py
export API_URL=https://data.tistatech.com
export APP_URL=https://covid19-dev.tistatech.com
export DATA_VERSION=2
export VUSERS_TOTAL=${VUSERS_TOTAL:-"1000"}
export VUSERS_PER_SEC=${VUSERS_PER_SEC:-"5"}
export DURATION_SEC=${DURATION_SEC:-"60"}

echo "==========================================================="
echo "Start locust load tests (${VUSERS_TOTAL} users, ${VUSERS_PER_SEC} users per/sec, ${DURATION_SEC} sec)"
echo "URL: webapp=${APP_URL}, api=${API_URL}"
echo ""
locust -f "${SCRIPT}" --headless \
    -u ${VUSERS_TOTAL} -r ${VUSERS_PER_SEC} \
    --run-time ${DURATION_SEC}s \
    --host "${API_URL}"
errcode=$?
echo "==========================================================="
if [ $errcode -eq 0 ]; then echo "✅ The locust tests passed";
else  echo "❌ The locust tests failed"; exit 1; fi
