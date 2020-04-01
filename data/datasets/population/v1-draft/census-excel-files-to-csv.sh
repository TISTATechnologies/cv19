#!/usr/bin/env bash
cd $(dirname "${0}")
wd=${PWD}
res_csv=./tmp-us-2019-population.csv

process_excel_file() {
    id=${1}
    orig_file="co-est2019-annchg-${id}.xlsx"
    excel_file=tmp-co-est2019-annchg.xlsx
    wget -qO "${excel_file}" "https://www2.census.gov/programs-surveys/popest/tables/2010-2019/counties/totals/${orig_file}" || continue
    if [ -f "${excel_file}" ]; then
        echo "File ${orig_file} downloaded. Converting..."
        python3 ./excel-to-csv.py "${excel_file}" >> "${res_csv}"
    fi
}

echo "STNAME,CTYNAME,POPESTIMATE2019" > "${res_csv}"
if [ -n "${1}" ]; then
    process_excel_file "${1}"
else
    for n1 in {0..6}; do
        for n2 in {0..9}; do
            process_excel_file "${n1}${n2}"
        done
    done
fi
echo "Done"