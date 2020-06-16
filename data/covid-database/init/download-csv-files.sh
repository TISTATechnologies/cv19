#!/usr/bin/env bash
echo "------------------------------------------------------------------------"
echo "| This script will create/update all csv files:                        |"
echo "|  countries information, us information, zips, and etc.               |"
echo "------------------------------------------------------------------------"
read -p "Continue (y/N)? " opt
if [ "${opt}" != "y" ] && [ "${opt}" != "Y" ]; then echo "Skip"; exit 1; fi

echo "Download Countries..."
echo "id,name,aliases,geo_lat,geo_long" > ./data-countries.csv
curl -s "https://data.tistatech.com/common/v1/countries.csv" \
| grep -v "latitude" \
| cut -d"," -f1,4,5,6,7 \
>> ./data-countries.csv && echo "- Complete"

echo "Download Countries Population..."
echo "country_id,state_id,fips,population" > ./data-countries-population.csv
curl -s "https://data.tistatech.com/common/v1/population.csv" \
| grep -v "population" \
| awk -F',' '{print $1",,,"$3}' \
>> ./data-countries-population.csv && echo "- Complete"

echo "Download US States..."
echo "id,country_id,name,type,aliases,fips,geo_lat,geo_long" > ./data-us-states.csv
curl -s "https://data.tistatech.com/common/v1/us/states.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "%s,US,%s,%s,,%02s,%s,%s\n",$1,$3,$4,$2,$5,$6}' \
>> ./data-us-states.csv && echo "- Complete"

echo "Download US Counties..."
echo "country_id,state_id,fips,name,aliases,type,geo_lat,geo_long" > ./data-us-regions.csv
curl -s "https://data.tistatech.com/common/v1/us/counties.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,county,%s,%s\n",$2,$1,$3,$4,$5}' \
>> ./data-us-regions.csv && \
curl -s "https://data.tistatech.com/common/v1/us/states.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,state,%s,%s\n",$1,$2,$3,$5,$6}' \
>> ./data-us-regions.csv && \
curl -s "https://data.tistatech.com/common/v1/countries.csv" \
| grep ",United States," \
| awk -F',' '{printf "%s,,00000,%s,,country,%s,%s\n",$1,$4,$6,$7}' \
>> ./data-us-regions.csv  && echo "- Complete"

echo "Download US Population..."
echo "country_id,state_id,fips,population" > ./data-us-population.csv
curl -s "https://data.tistatech.com/common/v1/us/population.csv" \
| grep -v "population" \
| sed 's/^/US,/g' \
>> ./data-us-population.csv && echo "- Complete"

echo "Download US zips..."
curl -s "https://data.tistatech.com/common/v1/us/zips.csv" > ./data-us-zip2fips.csv && echo "- Complete"

echo ""
echo "Done"