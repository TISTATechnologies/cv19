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

CREATE INDEX ON covid_data_stat (country_id);
CREATE INDEX ON covid_data_stat (state_id);
CREATE INDEX ON covid_data_stat (fips);
CREATE INDEX ON covid_data_stat (date);
CREATE INDEX ON covid_data_stat (location_type);

CREATE INDEX ON covid_data_stat_latest (country_id);
CREATE INDEX ON covid_data_stat_latest (state_id);
CREATE INDEX ON covid_data_stat_latest (fips);
CREATE INDEX ON covid_data_stat_latest (date);
CREATE INDEX ON covid_data_stat_latest (location_type);
