INSERT INTO _log(message) SELECT concat('Start update "', CURRENT_SCHEMA(), '" database');

UPDATE state SET type ='Associated State' WHERE id IN ('PW', 'FM', 'MH');

UPDATE region SET name = 'Prince George''s County' WHERE fips = '24033' AND country_id = 'US';
UPDATE region SET name = 'St. Mary''s County' WHERE fips = '24037' AND country_id = 'US';
UPDATE region SET name = 'Queen Anne''s County' WHERE fips = '24035' AND country_id = 'US';
UPDATE region SET name = 'O''Brien County' WHERE fips = '19141' AND country_id = 'US';
