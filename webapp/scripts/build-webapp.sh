#!/usr/bin/env bash
cd "$(dirname "${0}")/../.."

# load configuration
. ./scripts/load.env || exit 1
cd webapp

echo "REACT_APP_VIEW_ASSOCIATES=${REACT_APP_VIEW_ASSOCIATES}"
echo 'Building React application...'
react-scripts build || exit 1

# Download all flags
./scripts/download-flags.sh

# Create _version.json file
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

# Exclude files by special environments
if [ "${REACT_APP_VIEW_ASSOCIATES}" != "1" ]; then
    echo "Remove special files for NON-internal environment"
    rm -vf ./build/data/special-locations.json
fi

# # Create data/files.txt file
# mkdir ./build/data 2>/dev/null
# cd ./build/data
# find . -type f | sort | sed 's/\.\///g'> ./files.txt

echo "Build complete"
