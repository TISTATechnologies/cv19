#!/usr/bin/env bash

result_csv_file="../../covid-database/init/data-countries-population.csv"
cd $(dirname "${0}")

echo "Download countries population from  population.un.org"
curl -s "https://population.un.org/wpp/Download/Files/1_Indicators%20(Standard)/CSV_FILES/WPP2019_TotalPopulationBySex.csv" \
> ./tmp-countries-population.csv

echo "Choose only estimation for 2020"
grep ',2020,' ./tmp-countries-population.csv | grep ',Medium,' > ./tmp-countries-population-2020.csv

echo "Transform the population.un.org CSV info the proper csv file"
cat ./tmp-countries-population-2020.csv \
| python3 ./convert-population-un-org-csv-with-population.py > "${result_csv_file}"

echo "Clenup"
rm -f ./tmp-*

echo "Done: $(wc -l "${result_csv_file}")"


