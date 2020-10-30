#!/usr/bin/env bash
jq_replace() {
    key=${1}
    val=${2}
    if [ -n "${val}" ] && [ "${val}" != "null" ]; then
        jq ''${key}' = "'${val}'"';
    else
        jq -M 'del('${key}')';
    fi
}
update_config_file() {
    cfgfile=./build/config.json.orig
    newfile=./build/config.json
    echo "Updating config file ${newfile}..."
    cp "${newfile}" "${cfgfile}" || exit 1
    COMMON_DATA_URL=${REACT_APP_COMMON_DATA_URL:-"${COMMON_DATA_URL:-"$(jq -r '.commonDataUrl // ""' "${cfgfile}")"}"}
    COVID_DATA_URL=${REACT_APP_COVID_DATA_URL:-"${COVID_DATA_URL:-"$(jq -r '.covidDataUrl // ""' "${cfgfile}")"}"}
    GOOGLE_ANALYTICS_KEY=${REACT_APP_GOOGLE_ANALYTICS_KEY:-"${GOOGLE_ANALYTICS_KEY:-"$(jq -r '.googleAnalyticsKey // ""' "${cfgfile}")"}"}
    VIEW_ASSOCIATES=${REACT_APP_VIEW_ASSOCIATES:-"${VIEW_ASSOCIATES:-"$(jq -r '.viewAssociates // 0' "${cfgfile}")"}"}
    INTERNAL_DATA_URL=${REACT_APP_INTERNAL_DATA_URL:-"${INTERNAL_DATA_URL:-"$(jq -r '.internalDataUrl // ""' "${cfgfile}")"}"}
    cat "${cfgfile}" \
    | jq_replace '.commonDataUrl' "${COMMON_DATA_URL}" \
    | jq_replace '.covidDataUrl' "${COVID_DATA_URL}" \
    | jq_replace '.googleAnalyticsKey' "${GOOGLE_ANALYTICS_KEY}" \
    | jq_replace '.viewAssociates' "${VIEW_ASSOCIATES}" \
    | jq_replace '.internalDataUrl' "${INTERNAL_DATA_URL}" \
    > "${newfile}"
    rm -f "${cfgfile}"
    cat "${newfile}"
    echo "Update config file ${newfile} complete"

}

cd "$(dirname "${0}")/../../webapp"
update_config_file
