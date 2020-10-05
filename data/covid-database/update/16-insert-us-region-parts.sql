DELETE FROM region_part where country_id = 'US';
\copy region_part(country_id,state_id,fips,type,part_id) FROM ./data-us-region-parts.csv WITH DELIMITER ',' CSV HEADER;
