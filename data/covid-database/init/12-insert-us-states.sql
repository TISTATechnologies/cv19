DELETE FROM state where country_id = 'US';
\copy state FROM ./data-us-states.csv WITH DELIMITER ',' CSV HEADER;
