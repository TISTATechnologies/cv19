#!/bin/bash
#------------------------------------------------------------------------------
# crontab -e
# 0 4 * * * /home/cv19/cv19-src/scripts/cron/cv19-update-env.sh 2>&1 | tee /tmp/cron-script-test.log
#
# Usage: cv19-update-env.sh [dev(default)|demo|prod]
# System environment:
#   GIT_BRANCH      - default "master"
#   WEBAPP_ONLY     - default "false"
#------------------------------------------------------------------------------
#HOME=/home/cv19
info() { echo "$(date +"%Y-%m-%d %H:%M:%S") $@"; }

if [ -f "${HOME}/.profile" ]; then . ${HOME}/.profile; fi
if [ -f "${HOME}/.bash_profile" ]; then . ${HOME}/.bash_profile; fi
export PATH=/usr/local/bin:${PATH}

env=${1:-"dev"}
echo -e "dev\ndemo\nprod" | grep "^${env}$" >/dev/null
if [ $? -ne 0 ]; then echo "Incorrect environment '${env}'."; exit 1; fi

# ---- Update source code (git pull) ------------------------------------------
PRJ_DIR=${HOME}/cv19-src
REPO_URL=ssh://git-codecommit.us-east-1.amazonaws.com/v1/repos/cv19
BRANCH=${GIT_BRANCH:-"master"}

echo "CV19 project: update '${env}' environemnt"
cd ${HOME}
if [ -d "${PRJ_DIR}" ]; then
    read -p "Directory ${PRJ_DIR} exists. Overwrite (yes/No)? " opt
    if [ "${opt}" != "yes" ]; then echo "Skip."; exit 1; fi
fi
rm -rf "${PRJ_DIR}"
info "Clonning source code from the '${BRANCH}' branch."
git clone "${REPO_URL}" -b "${BRANCH}" "${PRJ_DIR}" || exit 1

# ---- Update database and webapp ---------------------------------------------
cd "${PRJ_DIR}"
info "Source code in '${PWD}' directory'"
git log --oneline -n 5

export CV19_ENV="${env}"
info "Updating '${CV19_ENV}' environment"
if [ "${WEBAPP_ONLY}" == "true" ]; then
    echo "WEBAPP_ONLY=${WEBAPP_ONLY}: Skip update database."
else
    ./scripts/_migrate_database.sh update || exit 1
fi
./scripts/_build-and-deploy-webapp.sh || exit 1
info "Updated '${CV19_ENV}' environment - complete"

info "Done"
