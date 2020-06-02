#!/usr/bin/env bash
# #############################################################################
## Upload all data from the build/covid directory to the s3 bucket
## Usage: upload-covid-data-to-s3-bucket.sh
# #############################################################################
title() { echo "======================================================================"; echo "$@"; }
version=${VERSION:-"1"}
bucket=${1:-"data.tistatech.com"}
CACHE_AGE=7200

cd "$(dirname "${0}")/.."
. ./scripts/load.env || exit 1
src_dir="${PWD}/build/covid"
target=/covid/v${version}

if [ ! -d "${src_dir}" ]; then echo "Directory ${src_dir} not found."; exit 1; fi

title "Upload all files into the s3 bucket"
echo "Source: ${src_dir}"
echo "target: s3://${bucket}${target}"
echo ""
read -p "Continue (y/N)? " opt
if [ "${opt}" != "y" ] && [ "${opt}" != "Y" ]; then error "Skip"; fi

title "Upload data with cache (all files except: latest and index.html)" \
&& aws s3 cp --recursive \
    --exclude ".*" --exclude "index.html" --exclude "*/latest/*" --exclude "*/latest.*" \
    "${src_dir}" "s3://${bucket}${target}" --cache-control max-age=${CACHE_AGE} \
&& title "Upload data without cache (latest and index.html)" \
&& aws s3 cp --recursive \
    --exclude "*" --include "index.html" --include "*/latest/*" --include "*/latest.*" \
    "${src_dir}" "s3://${bucket}${target}" --cache-control max-age=0 \
&& echo "Complete upload all files from ${src_dir}."