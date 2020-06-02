CREATE TABLE covid_data_source (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT,
    last_update TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE country (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT,
    geo_lat DECIMAL,
    geo_long DECIMAL
);

CREATE TABLE state (
    id TEXT NOT NULL,
    country_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    aliases TEXT,
    fips TEXT,
    geo_lat DECIMAL,
    geo_long DECIMAL,
    PRIMARY KEY (id, country_id),
    FOREIGN KEY (country_id) REFERENCES country (id)
);
CREATE UNIQUE INDEX state_uniq ON state (id, country_id, COALESCE(fips, ''));

CREATE TABLE region (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL,
    state_id TEXT,
    fips TEXT,
    name TEXT,
    aliases TEXT,
    type TEXT,
    geo_lat DECIMAL,
    geo_long DECIMAL,
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
CREATE UNIQUE INDEX region_uniq ON region (country_id, COALESCE(state_id, ''), COALESCE(fips, ''));

CREATE TABLE region_population (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL,
    state_id TEXT,
    fips TEXT,
    population INTEGER,
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
CREATE UNIQUE INDEX region_population_uniq ON region_population (country_id, COALESCE(state_id, ''), COALESCE(fips, ''));

CREATE TABLE zip_to_fips (
    zip TEXT NOT NULL,
    fips TEXT NOT NULL,
    name TEXT,
    country_id TEXT,
    state_id TEXT,
    PRIMARY KEY (zip, fips),
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);


CREATE TABLE covid_data (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,
    country_id TEXT NOT NULL,
    state_id TEXT,
    fips TEXT,
    confirmed INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    recovered INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 0,
    geo_lat DECIMAL,
    geo_long DECIMAL,
    note TEXT,
    datetime TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    source_location TEXT,
    source_updated TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    unique_key TEXT NOT NULL UNIQUE,
    FOREIGN KEY (source_id) REFERENCES covid_data_source (id),
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
-- COMMENT ON COLUMN covid_data.zip IS 'Postcode or zip code';
COMMENT ON COLUMN covid_data.confirmed IS '';
COMMENT ON COLUMN covid_data.deaths IS '';
COMMENT ON COLUMN covid_data.recovered IS '';
COMMENT ON COLUMN covid_data.active IS '';
COMMENT ON COLUMN covid_data.note IS 'Notes about this specific record';
COMMENT ON COLUMN covid_data.created IS 'When the record was created in our system';
COMMENT ON COLUMN covid_data.updated IS 'When the record was updated in our system';
COMMENT ON COLUMN covid_data.source_location IS 'Physical location name: hospital, county, and etc.';
COMMENT ON COLUMN covid_data.source_updated IS 'Datetime from the source system';
COMMENT ON COLUMN covid_data.datetime IS 'Data collected on this date and time';

CREATE TABLE covid_data_link (
    id SERIAL PRIMARY KEY,
    covid_data_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (covid_data_id) REFERENCES covid_data (id)
);

CREATE TABLE covid_info_link (
    id SERIAL PRIMARY KEY,
    country_id TEXT NOT NULL,
    state_id TEXT,
    fips TEXT,
    zip TEXT,
    url TEXT,
    note TEXT,
    published TIMESTAMP WITHOUT TIME ZONE, 
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
CREATE UNIQUE INDEX covid_info_link_uniq
    ON covid_info_link (country_id, COALESCE(state_id, ''), COALESCE(fips, ''),
        COALESCE(zip, ''), COALESCE(url, ''), COALESCE(published, '2000-01-01'));
COMMENT ON COLUMN covid_info_link.published IS 'When the link or document was created on the web server';
COMMENT ON COLUMN covid_info_link.created IS 'When the record about the link was created in the database';

CREATE TABLE special_locations (
    id SERIAL PRIMARY KEY,
    group_name TEXT NOT NULL,
    country_id TEXT NOT NULL,
    state_id TEXT,
    fips TEXT,
    name TEXT,
    description TEXT,
    value TEXT,
    FOREIGN KEY (country_id) REFERENCES country (id),
    FOREIGN KEY (state_id, country_id) REFERENCES state (id, country_id)
);
CREATE UNIQUE INDEX special_locations_uniq
    ON special_locations (group_name, country_id, COALESCE(state_id, ''), COALESCE(fips, ''));
