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

# Create _version.json file
mkdir ./build/ 2>/dev/null
echo -e "{
  \"version\": \"${REACT_APP_VERSION}\",
  \"buildtime\": \"${REACT_APP_BUILD_TIME}\"
}" > ./build/_version.json

# Exclude files by special environments
if [ "${REACT_APP_VIEW_ASSOCIATES}" != "1" ]; then
    echo "Remove special files for NON-internal environment"
    rm -vf ./build/data/special-locations.json
fi

# Create data/files.txt file
mkdir ./build/data 2>/dev/null
cd ./build/data
find . -type f | sort | sed 's/\.\///g'> ./files.txt

echo "Build complete"
