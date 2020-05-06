CREATE MATERIALIZED VIEW covid_data_stat AS
SELECT DISTINCT
  c.id AS country_id,
  s.id as state_id,
  r.fips,
  p.population,
  cd.confirmed,
  cd.deaths,
  cd.recovered,
  cd.active,
  cd.geo_lat,
  cd.geo_long,
  cd.note,
  CASE
    WHEN EXTRACT(hour FROM cd.source_updated) > 16 THEN cd.source_updated::TIMESTAMP::DATE
    ELSE ((cd.source_updated) - INTERVAL '1 DAY')::TIMESTAMP::DATE
  END as date,
  cd.source_updated as datetime,
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
  END AS location_type
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
ORDER BY c.id, s.id, r.fips, cd.source_updated DESC;


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


-- CREATE MATERIALIZED VIEW covid_data_stat_slim AS
-- SELECT
--   cd.country_id,
--   cd.state_id,
--   cd.fips,
--   p.population,
--   cd.confirmed,
--   cd.deaths,
--   cd.recovered,
--   cd.active,
--   cd.geo_lat,
--   cd.geo_long,
--   cd.note,
--   CASE
--     WHEN EXTRACT(hour FROM cd.datetime) > 16 THEN cd.datetime::TIMESTAMP::DATE
--     ELSE ((cd.datetime) - INTERVAL '1 DAY')::TIMESTAMP::DATE
--   END as date,
--   cd.source_updated as datetime,
--   CASE
--     WHEN (r.type is null and cd.state_id is null) THEN c.name
--     WHEN (r.type is null and cd.state_id is not null) THEN s.name
--     WHEN LOWER(r.type) = 'county' THEN r.name
--     ELSE LOWER(r.name)
--   END AS location_name,
--   CASE
--     WHEN (r.type is null and cd.state_id is null) THEN 'country'
--     WHEN (r.type is null and cd.state_id is not null) THEN 'state'
--     ELSE LOWER(r.type)
--   END AS location_type
-- FROM covid_data AS cd
-- INNER JOIN country AS c ON c.id = cd.country_id
-- INNER JOIN region_population p
--   ON ( (p.country_id = cd.country_id AND p.state_id = cd.state_id AND p.fips = cd.fips)
--         OR (p.country_id = cd.country_id AND p.state_id = cd.state_id AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
--         OR (p.country_id = cd.country_id AND COALESCE(p.state_id, 'NULL') = COALESCE(cd.state_id, 'NULL') AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
--   )
-- LEFT JOIN state AS s ON s.id = cd.state_id
-- LEFT JOIN region AS r ON r.fips = cd.fips
-- ORDER BY cd.source_updated DESC;


CREATE MATERIALIZED VIEW covid_data_stat_with_zip AS
SELECT
  v.*,
  zf.zip
FROM covid_data_stat AS v
LEFT JOIN zip_to_fips zf on zf.fips = v.fips
ORDER BY v.datetime DESC, zf.zip, v.fips;

-- TODO: DON'T need that views: please remove it in 2.0
-- CREATE OR REPLACE VIEW covid_data_stat_group_state AS
-- SELECT
--     cds.date, cds.country_id, c.name as country_name,
--     cds.state_id, s.name as state_name, COUNT(cds.fips) as records
-- FROM covid_data_stat as cds
-- INNER JOIN country as c on c.id = cds.country_id
-- LEFT JOIN state as s on s.id = cds.state_id
-- GROUP BY cds.date, cds.country_id, cds.state_id, c.name, s.name
-- ORDER BY cds.country_id, cds.date DESC, cds.state_id;

-- TODO: DON'T need that views: please remove it in 2.0
-- CREATE OR REPLACE VIEW covid_data_stat_group_country AS
-- SELECT
--     cds.date, cds.country_id, c.name as country_name, COUNT(cds.fips) as records
-- FROM covid_data_stat as cds
-- INNER JOIN country as c on c.id = cds.country_id
-- GROUP BY cds.date, cds.country_id, c.name
-- ORDER BY cds.country_id, cds.date DESC;

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
