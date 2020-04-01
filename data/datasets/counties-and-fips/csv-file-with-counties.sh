#!/usr/bin/env bash
#------------------------------------------------------------------------------
# US states have 3141 counties + Disctrict of Columbia
# Total US states counties: 3142
# Additionally US have counties in Territories and etc.
# http://google.com/search?q=How%20many%20counties%20are%20in%20the%20United%20States%202019?
#------------------------------------------------------------------------------
src_file=./cache/all-geocodes-v2017.csv
tmp_file=./tmp-us-counties.csv
output_file="../../covid-database/init/data-us-regions.csv"
src_us_states_csv="../../covid-database/init/data-us-states.csv"
#--------------------------------
end() { rm -f "${tmp_file:-"unknown"}"; exit ${1:-"0"}; }
debug() { >&2 echo $@; }

debug "Parse ${src_file} file"
grep -v '"000"' "${src_file}" | grep '"00000","00000","00000"' > "${tmp_file}"
us_counties_count_correct=3142
us_counties_count=$(grep -v '"72"' "${tmp_file}" | wc -l | sed 's/^[ ]*//g')
debug "Found ${us_counties_count} counties. US has ${us_counties_count_correct} counties"
if [ "${us_counties_count}" != "${us_counties_count_correct}" ]; then debug "Error: US counties count not mutch"; end 1; fi
debug "Found all counties"

echo "id,country_id,state_id,fips,name,aliases,type,geo_lat,geo_lang" > "${output_file}"
sed 's/"//g' "${tmp_file}" | while read v; do
    state_fips=$(echo "${v}" | awk -F',' '{print $2}')
    county_fisp=$(echo "${v}" | awk -F',' '{print $3}')
    city_fisp=$(echo "${v}" | awk -F',' '{print $5}')
    county_name=$(echo "${v}" | awk -F',' '{print $7}')
    type='county'
    if [ "${county_fisp}" == "000" ] && [ "${city_fisp}" == "00000" ]; then
         debug "Skip state: values = ${v}"
         continue
    fi
    if [ "${county_fisp}" == "000" ]; then
        debug "Skip non-county record: values = ${v}"
        continue
    fi
    # fix simple quote symbol for SQL script
    county_name=$(echo "${county_name}" | sed 's/'"'"'/'"''"'/g')
    fips=${state_fips}${county_fisp}
    aliases="$(echo ${county_name} | sed -e 's/ city//g' | sed -e 's/ town//g' | sed -e 's/ County//g' | sed 's/[ ]*$//g')"
    state_id=$(grep "${state_fips}" "${src_us_states_csv}" | cut -d"," -f1)
    # echo "State = ${state_fips}/${state_id}, county_id = ${county_fisp}, county_name = ${county_name}, aliases = [${aliases}]"
    # echo "INSERT INTO region(country_id,state_id,fips,name,aliases,type) VALUES('US','${state_id}','${fips}','${county_name}','${aliases}','${type}');"
    echo "US,${state_id},${fips},\"${county_name}\",\"${aliases}\",${type},,"
done | tee -a "${output_file}"

us_counties_count_in_csv=$(grep -v "'PR'" "${output_file}" | wc -l | sed 's/^[ ]*//g')
us_counties_count_in_csv=$((${us_counties_count_in_csv} - 1))
debug "Create ${us_counties_count_in_csv} counties in csv file. US has ${us_counties_count_correct} counties"
if [ ${us_counties_count_in_csv} -lt ${us_counties_count_correct} ]; then debug "Error: US counties count not mutch"; end 1; fi

debug "Copy states into the region table with fips."
grep -v "geo_lang" "${src_us_states_csv}" | sed 's/"[^"]*"//g' \
| awk -F',' '{print $2","$1",000"$6","$3",,state,,"}' | sort \
| tee -a "${output_file}"

debug "Add US to the region list."
echo "US,,00000,United State,,country,," | tee -a "${output_file}"

echo "Success create CSV file: ${output_sql}"
end $?