# Generate data-us-zip2fips.csv file

## Pull zip2fips from the huduser.gov
```bash
./huduser-gov/pull-zip-and-county-from-huduser-gov.py
```

## Get all zips ftom cdc-gov what is absent in huduser dataset
```bash
grep -v "zip,fips" ./cdc-gov/cdc-gov-sci_dataset_zipcty.csv \
| cut -d',' -f1 | sort -u > ./tmp-cdc-zips.txt

grep -v "zip,fips" ../../covid-database/init/data-us-zip2fips.csv \
| cut -d',' -f1 | sort -u > ./tmp-huduser-zips.txt

comm -13 ./tmp-huduser-zips.txt ./tmp-cdc-zips.txt > ./tmp-diff-zips.txt
```
## Add missing zips into the data-us-zip2fips
```bash
cat ./tmp-diff-zips.txt | while read zip; do
    grep "^${zip}," ./cdc-gov/cdc-gov-sci_dataset_zipcty.csv
done | tee -a "../../covid-database/init/data-us-zip2fips.csv"
```

## Add missing zips manually
```bash
./manual/manual-zip-to-fips-mapping.sh | tee -a "../../covid-database/init/data-us-zip2fips.csv"
```
## Clean up
rm -vf zipcty* tmp-*

## Validation

Get all fips count from zip_to_fips:
=> select count(tmp.*) from (select distinct fips from zip_to_fips) as tmp;
Get all fips count from zip_to_fips:
=> select count(tmp.*) from (select distinct fips from region where country_id = 'US') as tmp;

# TODO:

Invalid fips - state code:
```sql
select distinct zf.fips, zf.name, zf.country_id, zf.state_id from zip_to_fips zf left join region r on r.fips = zf.fips where r.fips is null;
```