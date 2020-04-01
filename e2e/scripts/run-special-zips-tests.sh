#!/usr/bin/env bash
###############################################################################
# Usage: run-special-zips-tests.sh <all/webapp/api>
# The 'all' level is ising by default
###############################################################################
# US,20850,20147,22204,20001,20852"         # Common zips
# 20147,20148,20584"                # 4/22 - not load data zips
# 67646,56011"                      # Zips with multiple counties

zips_random=$(echo -e "US
20850
20147
22204
20001
20852
20147
20148
20584
56011" | sort -R | tr '\n' ',')
zips_in_order="67646,20850,20147,20850,US,20850,20147,20148,20147,20850,20584"
ZIPS="${zips_in_order},${zips_random}"

cd $(dirname "${0}")/..
echo "======================================================================"
echo "Run test with special zips:"
echo "* Order zips : ${zips_in_order}"
echo "* Random zips: ${zips_random}"
echo ""
echo "* Total zips : ${ZIPS}"
echo ""
export ZIPS=${ZIPS}
npm run test:${1-"all"}
