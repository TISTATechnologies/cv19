## Counties
```bash
echo "id,name,aliases,geo_lat,geo_long" > ./data-countries.csv
curl -s "https://data.tistatech.com/common/v1/countries.csv" \
| grep -v "latitude" \
| cut -d"," -f1,4,5,6,7 \
>> ./data-countries.csv
dos2unix ./data-countries.csv && echo "Done"
```

## Countries Population
```bash
echo "country_id,state_id,fips,population" > ./data-countries-population.csv
curl -s "https://data.tistatech.com/common/v1/population.csv" \
| grep -v "population" \
| awk -F',' '{print $1",,,"$3}' \
>> ./data-countries-population.csv
dos2unix ./data-countries-population.csv && echo "Done"
```

## States
```bash
echo "id,country_id,name,type,aliases,fips,geo_lat,geo_long" > ./data-us-states.csv
curl -s "https://data.tistatech.com/common/v1/us/states.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "%s,US,%s,%s,,%02s,%s,%s\n",$1,$3,$4,$2,$5,$6}' \
>> ./data-us-states.csv
dos2unix ./data-us-states.csv && echo "Done"
```

## US Counties
```bash
echo "country_id,state_id,fips,name,aliases,type,geo_lat,geo_long" > ./data-us-regions.csv
curl -s "https://data.tistatech.com/common/v1/us/counties.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,county,%s,%s\n",$2,$1,$3,$4,$5}' \
>> ./data-us-regions.csv
curl -s "https://data.tistatech.com/common/v1/us/states.csv" \
| grep -v "latitude" \
| awk -F',' '{printf "US,%s,%05s,%s,,state,%s,%s\n",$1,$2,$3,$5,$6}' \
>> ./data-us-regions.csv
curl -s "https://data.tistatech.com/common/v1/countries.csv" \
| grep ",United States," \
| awk -F',' '{printf "%s,,00000,%s,,country,%s,%s\n",$1,$4,$6,$7}' \
>> ./data-us-regions.csv
dos2unix ./data-us-regions.csv && echo "Done"
```

## US Population
```bash
echo "country_id,state_id,fips,population" > ./data-us-population.csv
curl -s "https://data.tistatech.com/common/v1/us/population.csv" \
| grep -v "population" \
| sed 's/^/US,/g' \
>> ./data-us-population.csv
dos2unix ./data-us-population.csv && echo "Done"
```

## US zips
```bash
curl -s "https://data.tistatech.com/common/v1/us/zips.csv" > ./data-us-zip2fips.csv
```