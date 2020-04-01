DELETE FROM country;
\copy country FROM ./data-countries.csv WITH DELIMITER ',' CSV HEADER;
