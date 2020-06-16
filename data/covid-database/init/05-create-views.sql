/*
The view is using to group all Covid19 data by locations and date.
Inside each of the groups, only one top record will be chosen with the lowest source_id.
We can have multiple record from different sources for each location:
for example - two Covid-19 record for state Maryland from JHU (source_id = 1) and covidtracking (stource_id = 2)
This view will show only one record from JHU.
*/
CREATE MATERIALIZED VIEW covid_data_stat AS
SELECT DISTINCT ON (c.id, s.id, r.fips, cd.datetime::TIMESTAMP::DATE)
  c.id AS country_id,
  s.id as state_id,
  r.fips,
  p.population,
  cd.confirmed,
  cd.deaths,
  cd.recovered,
  cd.active,
  COALESCE(cd.geo_lat, r.geo_lat, s.geo_lat, c.geo_lat) as geo_lat,
  COALESCE(cd.geo_long, r.geo_long, s.geo_long, c.geo_long) as geo_long,
  cd.note,
  cd.datetime::TIMESTAMP::DATE as date,
  cd.datetime as datetime,
  cd.updated,
  cd.source_updated,
  cd.source_location as source_location,
  c.name AS country_name,
  s.name AS state_name,
  CASE
    WHEN LOWER(r.type) = 'country'
        OR (r.type is null and cd.state_id is null) THEN c.name
    WHEN LOWER(r.type) = 'state'
        OR (r.type is null and cd.state_id is not null) THEN s.name
    WHEN LOWER(r.type) = 'county' THEN CONCAT(r.name, ', ', s.id)
    ELSE r.name
  END AS location_name,
  CASE
    WHEN (r.type is null and cd.state_id is null) THEN 'country'
    WHEN (r.type is null and cd.state_id is not null) THEN 'state'
    ELSE LOWER(r.type)
  END AS location_type,
  cd.source_id
FROM country AS c
LEFT JOIN region AS r ON r.country_id = c.id
LEFT JOIN state AS s ON s.country_id = c.id
    AND (r.state_id IS NULL AND s.id IS NULL OR r.state_id = s.id)
LEFT JOIN region_population AS p ON p.country_id = c.id
    AND (p.state_id IS NULL AND s.id IS NULL OR p.state_id = s.id)
    AND (p.fips IS NULL AND r.fips IS NULL OR p.fips = r.fips)
LEFT JOIN covid_data AS cd
    ON cd.country_id = c.id
    AND COALESCE(cd.state_id, 'NULL') = COALESCE(s.id, 'NULL')
    AND COALESCE(cd.fips, 'NULL') = COALESCE(r.fips, 'NULL')
ORDER BY c.id, s.id, r.fips, cd.datetime::TIMESTAMP::DATE, cd.source_id, cd.source_updated DESC;


CREATE VIEW covid_data_stat_slim AS
SELECT
  cdv.country_id,
  cdv.state_id,
  cdv.fips,
  cdv.population,
  cdv.confirmed,
  cdv.deaths,
  cdv.recovered,
  cdv.active,
  cdv.geo_lat,
  cdv.geo_long,
  cdv.note,
  cdv.date,
  cdv.datetime,
  cdv.location_name,
  cdv.location_type
FROM covid_data_stat AS cdv;

/*
The view is using to select only latest (by time) Covid-19 data for each locations
*/
CREATE MATERIALIZED VIEW covid_data_stat_latest AS
SELECT
    cdv.country_id,
    cdv.state_id,
    cdv.fips,
    cdv.population,
    cdv.confirmed,
    cdv.deaths,
    cdv.recovered,
    cdv.active,
    cdv.geo_lat,
    cdv.geo_long,
    cdv.note,
    cdv.date,
    cdv.datetime,
    cdv.updated,
    cdv.source_updated,
    cdv.source_location,
    cdv.country_name,
    cdv.state_name,
    cdv.location_name,
    cdv.location_type
FROM (SELECT
        country_id,
        state_id, fips,
        MAX(datetime) AS datetime,
        MAX(date) AS date
    FROM covid_data_stat
    GROUP BY country_id, state_id, fips) AS ld
INNER JOIN covid_data_stat cdv
    ON ld.country_id = cdv.country_id
        AND (cdv.state_id IS NULL AND ld.state_id IS NULL OR cdv.state_id = ld.state_id)
        AND (cdv.fips IS NULL AND ld.fips IS NULL OR cdv.fips = ld.fips)
    AND ld.datetime = cdv.datetime
ORDER BY cdv.country_id, cdv.state_id, cdv.fips, cdv.datetime DESC;
