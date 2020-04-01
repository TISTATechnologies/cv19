#!/usr/bin/env bash
# requirements:
# pip3 install pylint pylint-quotes pylint-fail-under --user
THRESHOLD=5
cd $(dirname "${0}")/..
if [ "${UNITTESTS_ONLY}" != "true" ]; then
    path=${1:-"$(find . -name "*.py")"}
    echo "============================================================"
    echo "Start pylint tests"
    pylint=pylint-fail-under
    if [ -z "$(which "${pylint}")" ]; then
        pylint=$(python3 -c "import site, os; print(os.path.join(site.USER_BASE, 'bin', 'pylint-fail-under'));")
    fi
    if [ -z "$(which "${pylint}")" ]; then
        echo "Can't find pylint-fail-under tool."
        exit 1
    fi
    echo "${path}" | while read f; do
        echo "Start pylint on ${f} file"
        ${pylint} --rcfile=./.pylintrc --fail_under ${THRESHOLD} "${f}" || exit 1
    done
fi
echo "============================================================"
echo "Start unittests"
path=${1:-"$(find ./services/tests -name "*.py")"}
echo "${path}" | while read f; do
    echo "Start tests from the file: ${f}"
    ${f} || exit 1
done

