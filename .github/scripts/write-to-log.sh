#!/usr/bin/env bash
# Usage: (comand1; command 2;...) | ./to-log.sh
set -eo pipefail
(cat; echo "--------------------") | tee -a "${BUILD_LOG}"
