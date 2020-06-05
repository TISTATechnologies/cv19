# States
select type, count(*) from state group by type;
-- Result
       type       | count
------------------+-------
 Federal District |     1
 Territory        |     8
 State            |    50

# Counties on 2020
Source: https://en.wikipedia.org/wiki/County_(United_States)
Total = 3142 for States + DC
Total = 3243 for States + DC + Territories
```sql
SELECT s.type, COUNT(r.id) FROM region r
INNER JOIN state s ON s.id = r.state_id AND s.country_id = r.country_id
WHERE r.type = 'county' AND r.country_id = 'US' GROUP BY s.type
UNION
SELECT 'Total' as type, COUNT(*) FROM region r
WHERE r.type = 'county' AND r.country_id = 'US';
```
       type       | count
------------------+-------
 Total            |  3220
 Federal District |     1
 Territory        |   101
 State            |  3141

# Region

We are working only with 'state', 'country', 'county' types:
```sql
SELECT * FROM region WHERE type NOT IN ('county', 'state', 'country');
```
Result should be empty

Show all regions:
```sql
SELECT type, count(*) FROM region GROUP BY type;
```

  type   | count
---------+-------
 state   |    59
 country |     1
 county  |  3220


 # Zip for counties

## All zips have counties
```sql
SELECT 'Zips without counties' as note, zf.* 
FROM zip_to_fips zf
INNER JOIN region r ON r.country_id = zf.country_id AND r.state_id = zf.state_id AND r.fips = zf.fips 
WHERE r.id IS NULL;
```
Result should be empty

## All conunties have zips
```sql
SELECT 'Counties without zips' as note, r.* 
FROM region r
LEFT JOIN zip_to_fips zf ON r.country_id = zf.country_id AND r.state_id = zf.state_id AND r.fips = zf.fips 
WHERE r.type = 'county'
AND zf.zip IS NULL;
```
Result should be empty


# Population
## All countries should have population:
```sql
SELECT c.name FROM country c
LEFT JOIN region_population rp ON rp.country_id = c.id
    AND (rp.fips = '00000' or rp.fips IS NULL) AND rp.state_id is null
WHERE rp.population IS NULL;
```
Result should be empty


## All states should have population:
```sql
SELECT s.id, s.name, s.fips FROM state s
LEFT JOIN region_population rp ON rp.country_id = s.country_id
    AND rp.state_id = s.id
    AND rp.fips like '000%'
WHERE rp.population IS NULL
AND s.country_id = 'US';
```
Result should be empty

## All regions should have population:
```sql
SELECT s.country_id, s.name, r.name, r.fips
FROM region r
INNER JOIN state s ON s.id = r.state_id AND s.country_id = r.country_id
LEFT JOIN region_population rp ON rp.country_id = r.country_id
    AND rp.state_id = r.state_id
    AND rp.fips = r.fips
WHERE r.country_id = 'US'
AND r.type = 'county'
AND rp.population IS NULL
AND s.id <> 'PR';
```

