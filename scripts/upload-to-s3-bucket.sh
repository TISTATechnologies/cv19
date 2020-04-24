#!/usr/bin/env bash
# #############################################################################
## Upload all files from the specific directory into the AWS S3 Bucket
## Usage: upload-to-s3-bucket [directory with content] [bucket name]
##
## If a directory is not specified a current directory will be used.
## You can use S3_BUCKET system environment to specify bucket name.
# #############################################################################
show_help() { sed -n '/^##/,/^$/s/^## \{0,1\}//p' "$0"; exit 1; }

source=${1:-"${PWD}"}
bucket=${2:-"${S3_BUCKET}"}

if [ "${source:-"--help"}" == "--help" ] || [ -z "${bucket}" ]; then show_help; fi

aws_username=$(aws iam get-user --query 'User.UserName' --output text)
if [ -z "${aws_username}" ]; then echo "Error: can't get aws.get-user response."; exit 1; fi
echo "You are using '${aws_username}' username to connect to the AWS."

read -p "Upload all content from the ${source} directory to the '${bucket}' AWS S3 Bucket (y/N)? " opt
if [ "${opt}" != "y" ] && [ "${opt}" != "Y" ]; then echo "Skip!"; exit 1; fi

cd "${source}" || exit 1
echo "Clean up bucket first..."
aws s3 rm --recursive "s3://${bucket}" || exit 1
echo "Uploading all files from '${PWD}' directory (cache 1 day)..."
aws s3 sync --delete --exclude '.*' "${PWD}/static" "s3://${bucket}/static" --cache-control max-age=86400 \
&& echo "Uploading files with no-cache header..." \
&& aws s3 sync --exclude '.*' "${PWD}/data" "s3://${bucket}/data" --cache-control max-age=0 \
&& find . -type f -maxdepth 1 -exec aws s3 cp "{}" "s3://${bucket}" --cache-control max-age=0 \; \
&& echo "Upload complete" || exit 1
