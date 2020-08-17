#!/usr/bin/env bash
create_version_file() {
    mkdir ./build/ 2>/dev/null
    version_file=./build/_version.json
    echo "{" > "${version_file}"
    if [ -n "${BUILD_NUMBER}" ]; then
    echo "  \"version\": \"${REACT_APP_VERSION}.${BUILD_NUMBER}\"," >> "${version_file}"
    else
    echo "  \"version\": \"${REACT_APP_VERSION}\"," >> "${version_file}"
    fi
    echo "  \"buildtime\": \"${REACT_APP_BUILD_TIME}\"" >> "${version_file}"
    echo "}" >> "${version_file}"
}

cd "$(dirname "${0}")/../.."
# load configuration
. ./scripts/load.env || exit 1
cd webapp

echo 'Building React application...'
react-scripts build || exit 1

./scripts/download-flags.sh
./scripts/update-config-json.sh
create_version_file

echo "Build complete"
