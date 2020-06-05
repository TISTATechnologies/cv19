# All states have covid data
```sql
SELECT 'States without data' as note, s.*
FROM state s
LEFT JOIN covid_data_stat dz
    ON dz.state_id = s.id AND dz.location_type = 'state'
    AND dz.date = current_date - 2
WHERE dz IS NULL;
```
Result should be empty

# All counties have covid data
```sql
SELECT count(*) as "Counties without data"
FROM region r
INNER JOIN state s ON r.state_id = s.id AND r.country_id = s.country_id
AND r.type = 'county' AND s.type = 'State'
LEFT JOIN covid_data_stat dz
    ON dz.country_id = s.country_id AND dz.fips = r.fips AND dz.location_type = 'county'
    AND dz.date = current_date - 2
WHERE dz IS NULL;

SELECT 'Counties without data' as note, s.name, s.id, r.fips, r.name, r.type
FROM region r
INNER JOIN state s ON r.state_id = s.id AND r.country_id = s.country_id
AND r.type = 'county' AND s.type = 'State'
LEFT JOIN covid_data_stat dz
    ON dz.country_id = s.country_id AND dz.fips = r.fips AND dz.location_type = 'county'
    AND dz.date = current_date - 2
WHERE dz IS NULL;
```
Result should be empty

Data grouped by states
```sql
SELECT s.country_id, s.id, s.name, count(*)
FROM state s
INNER JOIN covid_data_stat dz
    ON dz.state_id = s.id AND dz.location_type = 'county'
    AND dz.date = current_date - 1
WHERE s.country_id = 'US'
GROUP BY s.country_id, s.id, s.name
ORDER BY s.country_id, s.id;
```

Data grouped by states is equal with state value
```sql
SELECT s.country_id, s.id, s.name, dz.location_type,
    sum(dz.confirmed) confirmed,
    sum(dz.deaths) deaths,
    sum(dz.recovered) recovered,
    sum(dz.active) active,
    count(dz.confirmed) regions
FROM state s
INNER JOIN covid_data_stat dz
    ON dz.state_id = s.id AND dz.location_type in ('county', 'state')
    AND dz.date = current_date - 1
WHERE s.country_id = 'US'
AND s.type <> 'Territory'
GROUP BY s.country_id, s.id, s.name, dz.location_type
ORDER BY s.country_id, s.id, regions, dz.location_type DESC;
```

