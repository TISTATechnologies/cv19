# Create zip2fips csv file from the dataset from cdc.gov

## Download Dataset for County Cross Reference File (FIPS/ZIP4)
Source for the zip2fips dataset is on the Centers for Disease Control and Prevention: 
https://wonder.cdc.gov/wonder/sci_data/codes/fips/type_txt/cntyxref.asp
```bash
wget https://wonder.cdc.gov/wonder/sci_data/datasets/zipctyA.zip && unzip zipctyA.zip; \
wget https://wonder.cdc.gov/wonder/sci_data/datasets/zipctyB.zip && unzip zipctyB.zip
```

## Transfer zipcty file into the temp.csv file (neded ~5 min)
./zip2fips-mapping-csv.py | tee tmp-zip2fips-raw.csv

## Remove duplicates in the csv (need  ~2 min)
echo "zip,fips,name,country_id,state_id" > ./cdc-gov-sci_dataset_zipcty.csv
sort -u tmp-zip2fips-raw.csv | tee -a ./cdc-gov-sci_dataset_zipcty.csv


## Clean up
rm -vf zipcty* tmp-*
