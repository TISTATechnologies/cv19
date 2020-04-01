DELETE FROM zip_to_fips;
\copy zip_to_fips FROM ./data-us-zip2fips.csv WITH DELIMITER ',' CSV HEADER;

-- Fix region names for zip-to-fips 
UPDATE zip_to_fips
    SET name = r.name
FROM region as r
WHERE r.fips = zip_to_fips.fips
    AND r.country_id = zip_to_fips.country_id
    AND r.state_id = zip_to_fips.state_id
    AND r.name <> zip_to_fips.name;
