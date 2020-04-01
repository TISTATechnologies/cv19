#!/usr/bin/env bash
# Create CSV file with counties and population
# The result CSV format will have format:
# country_id,state_id,fips,population
# US,AL,00001,4903185
# US,AL,01001,55869
# US,AL,01003,223234
# US,null,00000,32232323
# IT,null,null,23424232
result_csv_file="../../covid-database/init/data-us-population.csv"
cd $(dirname "${0}")

echo "Download csv file from the census site and cut unused information"
curl -s "https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals/co-est2019-alldata.csv" \
| awk -F',' '{print $4","$5","$6","$7","$19}' > ./tmp-us-2019-population-orig.csv

echo "The source file in the ISO-8859 encoding, convert it to utf8"
iconv -f ISO-8859-14 -t utf-8 tmp-us-2019-population-orig.csv > tmp-us-2019-population.csv

echo "Transform the raw census CSV info the proper csv file"
python3 ./convert-census-csv-with-population.py ./tmp-us-2019-population.csv > "${result_csv_file}"

echo "Clenup"
rm -f ./tmp-*

echo "Done: $(wc -l "${result_csv_file}")"


