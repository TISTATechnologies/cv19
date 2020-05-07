--
-- cat tista-zips-orig.csv | grep -v "Postal Code" | awk -F',' '{print $1","$2}' | sort -u > tista-zips.csv 
--

DROP TABLE IF EXISTS validation_zips;

CREATE TABLE validation_zips (
    zip TEXT PRIMARY KEY,
    country_id TEXT NOT NULL DEFAULT 'US',
    state_id TEXT NOT NULL,
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);

\copy validation_zips(state_id, zip) FROM ./tista-zips.csv WITH DELIMITER ',' CSV HEADER;


SELECT 'Zip not found in zip-to-fips mapping' as note, vz.* FROM validation_zips vz
LEFT JOIN zip_to_fips zf ON zf.zip = vz.zip
WHERE zf IS NULL;


SELECT 'Zip without data' as note, vz.*, zf.fips, r.name, r.type FROM validation_zips vz
LEFT JOIN zip_to_fips zf ON zf.zip = vz.zip
LEFT JOIN region r ON r.fips = zf.fips and r.country_id = vz.country_id
LEFT JOIN covid_data_stat ds
    ON ds.fips = zf.fips AND ds.date = current_date - 1
WHERE ds IS NULL
ORDER BY vz.country_id, vz.state_id, zf.fips;

DROP TABLE IF EXISTS validation_zips;