#!/usr/bin/env bash
cd $(dirname "${0}")/..
echo "------------------------------------------------"
echo "Build webapp and publish it to the AWS S3 bucket"
echo "------------------------------------------------"
. ./scripts/load.env || exit 1
echo "REACT_APP_VIEW_ASSOCIATES=${REACT_APP_VIEW_ASSOCIATES}"
cd webapp
npm install && \
npm run build && \
yes | npm run deploy && \
echo "Success"
