# Create CSV file with counties and population

The result CSV format should be:
```csv
state_id, fips, population
AL,,2000

```

## Generate

### Download csv file from the census site and cut unused information
```bash
././census-excel-files-to-csv.sh
```

### The source file in the ISO-8859 encoding, convert it to utf8
# iconv -f ISO-8859-14 -t utf-8 tmp-us-2019-population-orig.csv > tmp-us-2019-population.csv

### Transform the raw census CSV info the proper csv file
```bash
./create-counties-population.py ./tmp-us-2019-population.csv > ../../covid-database/data-us-population.csv
```
