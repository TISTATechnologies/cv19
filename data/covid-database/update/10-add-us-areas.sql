
CREATE TABLE region_part (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL,
    state_id TEXT NOT NULL,
    fips TEXT NOT NULL,
    type TEXT NOT NULL,
    part_id TEXT NOT NULL,
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
CREATE UNIQUE INDEX region_part_uniq ON region_part (country_id, state_id, fips, type, part_id);


INSERT INTO state (id, country_id, name, type, fips)
VALUES ('US', 'US', 'US Area', 'area', 'US');

INSERT INTO region (country_id, state_id, fips, name, type, geo_lat, geo_long)
VALUES ('US', 'US', '000US', 'US Area', 'area', null, null);
INSERT INTO region (country_id, state_id, fips, name, type, geo_lat, geo_long)
VALUES ('US', 'US', 'USDC1', 'Washington D.C. Metro Area', 'area', 38.91706,-77.00025);


INSERT INTO region_population (country_id, state_id, fips, population)
VALUES ('US', 'US', 'USDC1', 5613442);

