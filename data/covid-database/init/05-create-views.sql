CREATE MATERIALIZED VIEW covid_data_stat AS
SELECT
  cd.country_id,
  cd.state_id,
  cd.fips,
  p.population,
  cd.confirmed,
  cd.deaths,
  cd.recovered,
  cd.active,
  cd.geo_lat,
  cd.geo_long,
  cd.note,
  cd.datetime::TIMESTAMP::DATE as date,
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
FROM covid_data AS cd
INNER JOIN country AS c ON c.id = cd.country_id
INNER JOIN region_population p
  ON ( (p.country_id = cd.country_id AND p.state_id = cd.state_id AND p.fips = cd.fips)
        OR (p.country_id = cd.country_id AND p.state_id = cd.state_id AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
        OR (p.country_id = cd.country_id AND COALESCE(p.state_id, 'NULL') = COALESCE(cd.state_id, 'NULL') AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
  )
LEFT JOIN state AS s ON s.id = cd.state_id
LEFT JOIN region AS r ON r.fips = cd.fips
ORDER BY cd.source_updated DESC;

CREATE MATERIALIZED VIEW covid_data_stat_slim AS
SELECT
  cd.country_id,
  cd.state_id,
  cd.fips,
  p.population,
  cd.confirmed,
  cd.deaths,
  cd.recovered,
  cd.active,
  cd.geo_lat,
  cd.geo_long,
  cd.note,
  cd.datetime::TIMESTAMP::DATE as date,
  cd.source_updated as datetime,
  CASE
    WHEN (r.type is null and cd.state_id is null) THEN c.name
    WHEN (r.type is null and cd.state_id is not null) THEN s.name
    WHEN LOWER(r.type) = 'county' THEN r.name
    ELSE LOWER(r.name)
  END AS location_name,
  CASE
    WHEN (r.type is null and cd.state_id is null) THEN 'country'
    WHEN (r.type is null and cd.state_id is not null) THEN 'state'
    ELSE LOWER(r.type)
  END AS location_type
FROM covid_data AS cd
INNER JOIN country AS c ON c.id = cd.country_id
INNER JOIN region_population p
  ON ( (p.country_id = cd.country_id AND p.state_id = cd.state_id AND p.fips = cd.fips)
        OR (p.country_id = cd.country_id AND p.state_id = cd.state_id AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
        OR (p.country_id = cd.country_id AND COALESCE(p.state_id, 'NULL') = COALESCE(cd.state_id, 'NULL') AND COALESCE(p.fips, 'NULL') = COALESCE(cd.fips, 'NULL'))
  )
LEFT JOIN state AS s ON s.id = cd.state_id
LEFT JOIN region AS r ON r.fips = cd.fips
ORDER BY cd.source_updated DESC;


CREATE MATERIALIZED VIEW covid_data_stat_with_zip AS
SELECT
  v.*,
  zf.zip
FROM covid_data_stat AS v
LEFT JOIN zip_to_fips zf on zf.fips = v.fips
ORDER BY v.datetime DESC, zf.zip, v.fips;

-- TODO: calculate total for each of the states
CREATE OR REPLACE VIEW covid_data_stat_group_state AS
SELECT
    cds.date, cds.country_id, c.name as country_name,
    cds.state_id, s.name as state_name, COUNT(cds.fips) as records
FROM covid_data_stat as cds
INNER JOIN country as c on c.id = cds.country_id
LEFT JOIN state as s on s.id = cds.state_id
GROUP BY cds.date, cds.country_id, cds.state_id, c.name, s.name
ORDER BY cds.country_id, cds.date DESC, cds.state_id;

-- TODO: calculate total for each of the countries
CREATE OR REPLACE VIEW covid_data_stat_group_country AS
SELECT
    cds.date, cds.country_id, c.name as country_name, COUNT(cds.fips) as records
FROM covid_data_stat as cds
INNER JOIN country as c on c.id = cds.country_id
GROUP BY cds.date, cds.country_id, c.name
ORDER BY cds.country_id, cds.date DESC;

