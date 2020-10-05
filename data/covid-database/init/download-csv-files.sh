#!/usr/bin/env bash
VERSION=2
URL="https://data.tistatech.com/common/v${VERSION}"
TS=$(date +%s)
echo "------------------------------------------------------------------------"
echo "| This script will create/update all csv files:                        |"
echo "|  countries information, us information, zips, and etc.               |"
echo "------------------------------------------------------------------------"
read -p "Download data from the ${URL} (y/N)? " opt
if [ "${opt}" != "y" ] && [ "${opt}" != "Y" ]; then echo "Skip"; exit 1; fi

echo "Download Countries..."
echo "id,name,aliases,geo_lat,geo_long" > ./data-countries.csv
curl -s "${URL}/countries.csv?ts=${TS}" \
| grep -v "latitude" \
| cut -d"," -f1,4,5,6,7 \
>> ./data-countries.csv && echo "- Complete"

echo "Download Countries Population..."
echo "country_id,state_id,fips,population" > ./data-countries-population.csv
curl -s "${URL}/population.csv?ts=${TS}" \
| grep -v "population" \
| awk -F',' '{print $1",,,"$3}' \
>> ./data-countries-population.csv && echo "- Complete"

echo "Download US States..."
echo "id,country_id,name,type,aliases,fips,geo_lat,geo_long" > ./data-us-states.csv
curl -s "${URL}/us/states.csv?ts=${TS}" \
| grep -v "latitude" \
| awk -F',' '{printf "%s,US,%s,%s,,%02d,%s,%s\n",$1,$3,$4,$2,$5,$6}' \
| sed 's/^US,US,US Area,area,,00/US,US,US Area,area,,US/g' \
>> ./data-us-states.csv && echo "- Complete"

echo "Download US Counties..."
echo "country_id,state_id,fips,name,aliases,type,geo_lat,geo_long" > ./data-us-regions.csv
curl -s "${URL}/us/counties.csv?ts=${TS}" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,county,%s,%s\n",$2,$1,$3,$4,$5}' \
>> ./data-us-regions.csv && \
curl -s "${URL}/us/states.csv?ts=${TS}" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,state,%s,%s\n",$1,$2,$3,$5,$6}' \
| sed 's/,    /,0000/g' \
| sed 's/,   /,000/g' \
| sed 's/US Area,,state/US Area,,area/g' \
>> ./data-us-regions.csv && \
curl -s "${URL}/countries.csv?ts=${TS}" \
| grep ",United States," \
| awk -F',' '{printf "%s,,00000,%s,,country,%s,%s\n",$1,$4,$6,$7}' \
>> ./data-us-regions.csv \
&& echo "- Complete"


echo "Download US Population..."
echo "country_id,state_id,fips,population" > ./data-us-population.csv
curl -s "${URL}/us/population.csv?ts=${TS}" \
| grep -v "population" \
| sed 's/^/US,/g' \
>> ./data-us-population.csv && echo "- Complete"

echo "Download US zips..."
curl -s "${URL}/us/zips.csv?ts=${TS}" \
| sed 's/,02063/,02261/g' \
> ./data-us-zip2fips.csv \
&& echo "- Complete"

echo "Download areas..."
echo "country_id,state_id,fips,type,part_id,geo_lat,geo_long" > ./data-us-region-parts.csv
curl -s "${URL}/us/areas.json?ts=${TS}" \
| jq -cr '.[] as $entity | $entity.counties[] | [$entity.fips,.fips,$entity.latitude,$entity.longitude]' \
| sed 's/\[//g' | sed 's/\]//g' | sed 's/"//g' \
| awk -F ',' '{print "US,US,"$1",county,"$2","$3","$4}' \
>> ./data-us-region-parts.csv \
&& echo "- Complete"


echo ""
echo "Done"