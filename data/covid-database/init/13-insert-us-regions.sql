DELETE FROM region where country_id = 'US';
\copy region(country_id,state_id,fips,name,aliases,type,geo_lat,geo_lang) FROM ./data-us-regions.csv WITH DELIMITER ',' CSV HEADER;
