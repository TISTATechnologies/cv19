#!/usr/bin/env bash
###############################################################################
# Helper script: send email notification from the GitHub Actions job
###############################################################################
export SMTP_USERNAME=${SMTP_USERNAME}
export SMTP_PASSWORD=${SMTP_PASSWORD}
export SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}
export NODE_ENV=${NODE_ENV:-"development"}
export RECIPIENT=${1}
JOB_STATUS=${2}
LOG_FILE=${3}
JOB_NAME=${GITHUB_WORKFLOW}

if [ -z "${RECIPIENT}" ] || [ -z "${JOB_STATUS}" ] || [ -z "${LOG_FILE}" ]; then
    echo "Usage: $(basename "${0}") <recipient> <job-status> <build-file-log-path>"
    exit 1
fi
SMTPSENDER=$(dirname "${0}")/../../scripts/smtpsender
BRANCH=$(echo "${GITHUB_REF}" | sed 's/^refs\/heads\///g')
REPO=${GITHUB_REPOSITORY}
echo "Execute ${SMTPSENDER}"
grep -v '^[[:space:]]*$' "${LOG_FILE}" \
| "${SMTPSENDER}" "[${REPO}] Run ${JOB_STATUS}: ${JOB_NAME} - ${BRANCH} [env=${NODE_ENV}]"
