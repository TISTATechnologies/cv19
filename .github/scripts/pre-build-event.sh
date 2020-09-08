#!/usr/bin/env bash
SOURCE_IP=$(wget -q -O - http://icanhazip.com | head -n 1)
GH_NOTIFICATION_LAMBDA_NAME="${GH_NOTIFICATION_LAMBDA_NAME}"
GH_NOTIFICATION_LAMBDA_KEY="${GH_NOTIFICATION_LAMBDA_KEY}"
EVENT_NAME=$(echo "${GITHUB_REPOSITORY:-"repo"}/${GITHUB_WORKFLOW:-"workflow"}/${GITHUB_EVENT_NAME:-"event"}" | sed 's/ /_/g')
LOG_FILE="./${GH_NOTIFICATION_LAMBDA_NAME}.out"

echo "Send pre-build notificatio: ${EVENT_NAME}"
echo "GitHub runner public IP: ${SOURCE_IP}"
echo "Log file: ${LOG_FILE}"
aws lambda invoke --function-name "${GH_NOTIFICATION_LAMBDA_NAME}" "${LOG_FILE}" \
    --payload "{\"name\": \"${EVENT_NAME}\",\"key\": \"${GH_NOTIFICATION_LAMBDA_KEY}\", \"source\": \"${SOURCE_IP}\"}"
if [ -f "${LOG_FILE}" ]; then
    cat "${LOG_FILE}"; echo "";
    if [ -n "$(grep "errorMessage" "${LOG_FILE}")" ]; then exit 1; fi
else "Log file '${LOG_FILE}' not found."; exit 1; fi

# --log-type Tail --query 'LogResult' --output text | base64 -d
