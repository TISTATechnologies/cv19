DELETE FROM region_population;

\copy region_population(country_id,state_id,fips,population) FROM ./data-countries-population.csv WITH DELIMITER ',' CSV HEADER;

\copy region_population(country_id,state_id,fips,population) FROM ./data-us-population.csv WITH DELIMITER ',' CSV HEADER;

-- Fix record with US population
 UPDATE region_population SET fips = '00000' WHERE country_id = 'US' and state_id is null;
 
-- Fix population for the US territories
INSERT INTO region_population(country_id, state_id, fips, population)
SELECT s.country_id, s.id, CONCAT('000', s.fips) as fips, rp.population
FROM state s
INNER JOIN (SELECT s.country_id, s.id as state_id
            FROM state s INNER JOIN country c ON c.id = s.id
            WHERE s.type = 'Territory') t
            ON t.country_id = s.country_id AND t.state_id = s.id
INNER JOIN region_population rp
            ON rp.country_id = s.id AND rp.state_id is null AND rp.fips is null
WHERE s.country_id = 'US';
