DELETE FROM zip_to_fips;
\copy zip_to_fips(zip,fips) FROM ./data-us-zip2fips.csv WITH DELIMITER ',' CSV HEADER;

-- Fix region names for zip-to-fips 
UPDATE zip_to_fips
    SET country_id = r.country_id,
        state_id = r.state_id,
        name = r.name
FROM region as r
WHERE zip_to_fips.name is null
    AND r.country_id = 'US'
    AND r.fips = zip_to_fips.fips;
