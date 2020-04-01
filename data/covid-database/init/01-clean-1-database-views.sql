-- SET search_path TO api;
DROP VIEW IF EXISTS covid_data_stat_group_state;
DROP VIEW IF EXISTS covid_data_stat_group_country;

DROP MATERIALIZED VIEW IF EXISTS covid_data_stat_with_zip;
DROP MATERIALIZED VIEW IF EXISTS covid_data_stat_slim;
DROP MATERIALIZED VIEW IF EXISTS covid_data_stat;
