#!/usr/bin/env bash
cd $(dirname "${0}")/../..

# load configuration
. ./scripts/load.env
cd webapp

echo "REACT_APP_VIEW_ASSOCIATES=${REACT_APP_VIEW_ASSOCIATES}"
echo 'Building React application...'
react-scripts build

# Download all flags
./scripts/download-flags.sh

# Create _version.txt file
mkdir ./build/ 2>/dev/null
date +"%Y-%m-%dT%H:%M:%S%z" > ./build/_version.txt

# Exclude files by special environments
if [ "${REACT_APP_VIEW_ASSOCIATES}" != "1" ]; then
    echo "Remove special files for NON-internal environment"
    rm -vf ./build/data/special-locations.json
fi

echo "Build complete"
