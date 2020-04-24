DELETE FROM special_locations;

\copy special_locations(group_name, country_id,state_id,fips,name,description,value) FROM ./data-special-locations.csv WITH DELIMITER ',' CSV HEADER;
