\copy zip_to_fips(zip,fips) FROM ./12-additional-zip-to-fips.csv WITH DELIMITER ',' CSV HEADER;

UPDATE zip_to_fips
    SET country_id = r.country_id,
        state_id = r.state_id,
        name = r.name
FROM region as r
WHERE zip_to_fips.name is null
    AND r.fips = zip_to_fips.fips;
