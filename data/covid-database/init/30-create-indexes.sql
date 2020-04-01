CREATE INDEX ON covid_data (source_id);
CREATE INDEX ON covid_data (country_id);
CREATE INDEX ON covid_data (state_id);

CREATE INDEX ON state (country_id);
CREATE INDEX ON state (fips);

CREATE INDEX ON region (country_id);
CREATE INDEX ON region (state_id);
CREATE INDEX ON region (fips);

CREATE INDEX ON region_population (country_id);
CREATE INDEX ON region_population (state_id);
CREATE INDEX ON region_population (fips);
