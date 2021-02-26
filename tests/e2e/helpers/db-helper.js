#!/usr/bin/env node
const fs = require('fs');
const pg = require('pg');
const { Config } = require('./config');
const { shuffleArray } = require('./util');

const config = new Config();
const log = config.log;
const Client = pg.Client;

// Do not parse timestamp value to the Date, read it as a raw string value
pg.types.setTypeParser(1114, (stringValue) => stringValue.replace(' ', 'T'));

const createVal1AndVal2 = (item, fieldName) => {
    if (item.population) {
        if (item[fieldName] !== undefined && item[fieldName] !== null) {
            item[`${fieldName}_val1`] = item[fieldName].toLocaleString();
            item[`${fieldName}_val2`] = Math.ceil((item[fieldName] / item.population) * 1e5).toLocaleString();
        }
        item[fieldName] = undefined;
    } else {
        item[`${fieldName}_val1`] = null;
        item[`${fieldName}_val2`] = null;
    }
}

const formatItem = (item) => {
    if (!item) {
        log.warn(`Received an empty item`);
        return null;
    }
    createVal1AndVal2(item, 'confirmed');
    createVal1AndVal2(item, 'deaths');
    createVal1AndVal2(item, 'active');
    createVal1AndVal2(item, 'recovered');
    createVal1AndVal2(item, 'hospitalized_currently');
    createVal1AndVal2(item, 'vaccination_distributed');
    createVal1AndVal2(item, 'vaccination_administered');
    createVal1AndVal2(item, 'vaccination_adm_dose1');
    createVal1AndVal2(item, 'vaccination_adm_dose2');
    if (item.population) {
        item.population = item.population.toLocaleString();
    }
    item.hospitalized_val1 = item.hospitalized_currently_val1;
    item.hospitalized_val2 = item.hospitalized_currently_val2;
    item.vaccination_val1 = item.vaccination_administered_val1;
    item.vaccination_val2 = item.vaccination_administered_val2;
    item.vaccine_val1 = item.vaccination_val1;
    item.vaccine_val2 = item.vaccination_val2;
    return item;
}

const executeInDataBase = async (query, params = undefined) => {
    log.info(`Database: ${config.getConnectionString()}`);
    const client = new Client();
    try {
        await client.connect();
        if (process.env.PGSCHEMA) {
            log.debug(`Use ${process.env.PGSCHEMA} schema in database`);
            client.query(`SET search_path TO '${process.env.PGSCHEMA}';`);
        }
        log.debug(`Execute query: ${query}`);
        const items = (await client.query(query, params || [])).rows;
        return items;
    } catch (err) {
        log.error(`Error read data from the database.`);
        throw err;
    } finally {
        try {
            if (client) {
                client.end();
            }
        } catch (err) {
            log.warn(`Close connection error: ${err.stack || err}`);
        }
    }
}

const loadUSData = async (day) => {
    log.info(`Load US data on the ${day} day`);
    return executeInDataBase(
        'SELECT \'US\' as id, location_name as name, datetime, '
        + 'population, confirmed, deaths, active, recovered, '
        + 'hospitalized_currently, hospitalized_cumulative, in_icu_currently, in_icu_cumulative, '
        + 'on_ventilator_cumulative, on_ventilator_currently, '
        + 'vaccination_distributed, vaccination_administered, vaccination_adm_dose1, vaccination_adm_dose2 '
        + 'FROM covid_data_stat WHERE country_id = \'US\' AND location_type = \'country\' AND date = $1;',
        [day]);
}

const loadStatesData = async (day) => {
    log.info(`Load States data on the ${day} day`);
    return executeInDataBase(
        'SELECT state_id as id, location_name as name, datetime, '
        + 'population, confirmed, deaths, active, recovered, '
        + 'hospitalized_currently, hospitalized_cumulative, in_icu_currently, in_icu_cumulative, '
        + 'on_ventilator_cumulative, on_ventilator_currently, '
        + 'vaccination_distributed, vaccination_administered, vaccination_adm_dose1, vaccination_adm_dose2 '
        + 'FROM covid_data_stat WHERE country_id = \'US\' AND location_type = \'state\' AND date = $1;',
        [day]);
}

const loadCountiesData = async (day) => {
    log.info(`Load Counties data on the ${day} day`);
    return executeInDataBase(
        'SELECT r.fips, r.state_id, CONCAT(r.name, \', \', r.state_id) AS name, datetime, '
        + '  p.population, COALESCE(cds.confirmed, 0) AS confirmed, COALESCE(cds.deaths, 0) AS deaths, '
        + '  COALESCE(cds.active, 0) AS active, COALESCE(cds.recovered, 0) AS recovered '
        + 'FROM region AS r '
        + 'INNER JOIN region_population AS p ON p.country_id = r.country_id AND p.state_id = r.state_id AND p.fips = r.fips '
        + 'INNER JOIN covid_data_stat AS cds ON cds.country_id = r.country_id AND cds.state_id = r.state_id AND cds.fips = r.fips '
        + '  AND cds.date = $1 '
        + 'WHERE r.country_id = \'US\' AND LOWER(r.type) = \'county\' ORDER BY cds.datetime DESC, r.fips;',
        [day]);
}

const dataMapping = (usData, statesData, countiesData, day) => {
    const result = {date: day}
    log.info(`Creating result data object...`);
    log.debug(`Processing US...`)
    result.US = {state: formatItem(usData), counties: null};
    result.counties = []
    let count = 0;
    for (let county of countiesData) {
        // log.debug(`Processing ${county.zip} zip...`)
        let stateInfo = null;
        for (let state of statesData) {
            if (county.state_id === state.id) {
                stateInfo = formatItem(state);
                break;
            }
        }
        if (!stateInfo) {
            log.warn(`Data not found for the '${county.state_id}' state`);
        }
        const countyInfo = formatItem(county);
        result.counties.push({state: stateInfo, county: countyInfo});
        count += 1;
    }
    log.info(`Create result data object complete ${count} counties`);
    return result;
}

const loadExecutiveLinks = async () => {
    log.info(`Load Executive Links`);
    return executeInDataBase(`SELECT country_id, state_id, fips, zip, note, url, published FROM covid_info_link;`);
}

const loadZips = async (count=0, shuffle=false) => {
    log.info(`Load Zips`);
    const rawZips = await executeInDataBase(`SELECT zip,fips FROM zip_to_fips;`);
    return rawZips; // .map((i) => i.zip);
}

const loadSpecialLocations = async (count=0, shuffle=false) => {
    log.info(`Load special locations fips`);
    const rawItems = await executeInDataBase(`SELECT fips FROM special_locations WHERE group_name = 'TEMPL';`);
    return rawItems; // .map((i) => i.zip);
}

const generateDataJson = async () => {
    const queryDay = config.testDate;
    const usData = (await loadUSData(queryDay))[0];
    log.info(`US = ${JSON.stringify(usData)}`);
    const statesData = await loadStatesData(queryDay);
    log.info(`States = ${statesData.length}`);
    // log.debug(`States: ${JSON.stringify(statesData)}`)
    const countiesData = await loadCountiesData(queryDay);
    log.info(`Counties = ${countiesData.length}`);
    const resData = await dataMapping(usData, statesData, countiesData, queryDay);
    return resData;
}
const main = async () => {
    try {
        const cv19Data = await generateDataJson();
        const cv19DataResult = JSON.stringify(cv19Data, null, 2)

        log.info(`Write cv19 data to the ${config.data_file} file.`);
        fs.writeFileSync(config.data_file, cv19DataResult);

        const zips = await loadZips();
        log.info(`Write zips to the ${config.zips_file} file.`);
        // const zipStr = zips.join('\n');
        const zipStr = JSON.stringify(zips, null, 2);
        fs.writeFileSync(config.zips_file, zipStr);

        const links = await loadExecutiveLinks();
        const linksResult = JSON.stringify(links, null, 2)
        log.info(`Write executive links to the ${config.executive_links_file} file.`);
        fs.writeFileSync(config.executive_links_file, linksResult);

        const specialLocations = await loadSpecialLocations();
        const specialLocationsObj = JSON.stringify(specialLocations, null, 2)
        log.info(`Write special locations to the ${config.special_locations_file} file.`);
        fs.writeFileSync(config.special_locations_file, specialLocationsObj);
    } catch (err) {
        log.error(`Error: ${err.stack || err}`);
        throw err;
    }
}

if (require.main === module) {
    main();
} else {
    module.exports.generateDataJson = generateDataJson;
    module.exports.loadZips = loadZips;
    module.exports.exec = executeInDataBase;
}