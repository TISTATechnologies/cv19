DELETE FROM region_population;

\copy region_population(country_id,state_id,fips,population) FROM ./data-countries-population.csv WITH DELIMITER ',' CSV HEADER;

\copy region_population(country_id,state_id,fips,population) FROM ./data-us-population.csv WITH DELIMITER ',' CSV HEADER;

-- TODO: move the code below to the dataset builders.
-- Virginia Island from Wikipedia: https://en.wikipedia.org/wiki/Virgin_Islands
INSERT INTO region_population(country_id, state_id, fips, population)
VALUES('VI', null, null, 104901);

-- Micronesia from Wikipedia: https://en.wikipedia.org/wiki/Federated_States_of_Micronesia
INSERT INTO region_population(country_id, state_id, fips, population)
VALUES('FM', null, null, '112640');


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
