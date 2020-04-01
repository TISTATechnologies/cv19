#!/bin/bash
#------------------------------------------------------------------------------
# crontab -e
# 0 4 * * * /home/cv19/cv19-src/scripts/cron/cv19-collect-data.sh 2>&1 | tee /tmp/cv19-collect-data.log
#------------------------------------------------------------------------------
#HOME=/home/cv19

if [ -f "${HOME}/.profile" ]; then . ${HOME}/.profile; fi
if [ -f "${HOME}/.bash_profile" ]; then . ${HOME}/.bash_profile; fi
export PATH=/usr/local/bin:${PATH}

env=${1:-"dev"}
echo -e "dev\ndemo\nprod" | grep "^${env}$" >/dev/null
if [ $? -ne 0 ]; then echo "Incorrect environment '${env}'."; exit 1; fi

yes | $(dirname "${0}")/../_start-all-pull-data-services.sh --profile "${env}"
