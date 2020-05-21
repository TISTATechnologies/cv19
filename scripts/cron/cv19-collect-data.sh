#!/usr/bin/env bash
#------------------------------------------------------------------------------
# crontab -e
# 0 4 * * * /home/cv19/cv19-src/scripts/cron/cv19-collect-data.sh 2>&1 | tee /tmp/cv19-collect-data.log
#------------------------------------------------------------------------------
#HOME=/home/cv19

if [ -f "${HOME}/.profile" ]; then . ${HOME}/.profile; fi
if [ -f "${HOME}/.bash_profile" ]; then . ${HOME}/.bash_profile; fi
export PATH=/usr/local/bin:${PATH}

env=${1:-"dev"}
echo "Starting..."
yes | $(dirname "${0}")/../_start-all-data-services.sh --profile "${env}"
