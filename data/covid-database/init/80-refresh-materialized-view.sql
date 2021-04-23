DROP INDEX IF EXISTS covid_data_stat_country_id_idx;
DROP INDEX IF EXISTS covid_data_stat_state_id_idx;
DROP INDEX IF EXISTS covid_data_stat_fips_idx;
DROP INDEX IF EXISTS covid_data_stat_location_type_idx;
DROP INDEX IF EXISTS covid_data_stat_date_idx;

REFRESH MATERIALIZED VIEW covid_data_stat;
REFRESH MATERIALIZED VIEW covid_data_stat_latest;

CREATE INDEX ON covid_data_stat (country_id);
CREATE INDEX ON covid_data_stat (state_id);
CREATE INDEX ON covid_data_stat (fips);
CREATE INDEX ON covid_data_stat (date);
CREATE INDEX ON covid_data_stat (location_type);
