#!/usr/bin/env bash
cd "$(dirname "${0}")/../.."

# load configuration
. ./scripts/load.env || exit 1
cd webapp
source=./build
bucket=${S3_BUCKET}
quiet=0
echo "Upload all content from the ${source} directory to the '${bucket}' AWS S3 Bucket"
if !( echo "$@" | grep '\-\-quiet\|\-\-silent' >/dev/null); then
    read -p "Continue (y/N)? " opt
    if [ "${opt}" != "y" ] && [ "${opt}" != "Y" ]; then echo "Skip!"; exit 1; fi
fi

cd "${source}" || exit 1
echo "Clean up bucket first..."
aws s3 rm --recursive "s3://${bucket}" || exit 1

echo "Uploading all files from '${PWD}' directory (cache 1 day)..." \
&& aws s3 sync --exclude ".*" "${PWD}/static" "s3://${bucket}/static" --cache-control max-age=86400 \
&& echo "Uploading files with no-cache header..." \
&& aws s3 sync --exclude ".*" "${PWD}/data" "s3://${bucket}/data" --cache-control max-age=0 \
&& find . -type f -maxdepth 1 -exec aws s3 cp "{}" "s3://${bucket}" --cache-control max-age=0 \; \
&& echo "Upload complete" || exit 1
