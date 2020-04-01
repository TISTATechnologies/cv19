#!/usr/bin/env node
const fs = require('fs');
const { Client } = require('pg');
const { Config } = require('./config');
const { shuffleArray, getDayForApi } = require('./util');

const config = new Config();

const formatItem = (item) => {
    if (item.confirmed !== undefined && item.confirmed !== null) {
        item.confirmed_val1 = item.confirmed.toLocaleString();
        item.confirmed_val2 = Math.ceil((item.confirmed / item.population) * 1e5);
    }
    item.confirmed = undefined;
    if (item.deaths !== undefined && item.deaths !== null) {
        item.deaths_val1 = item.deaths.toLocaleString();
        item.deaths_val2 = Math.ceil((item.deaths / item.population) * 1e5);
    }
    item.deaths = undefined;
    if (item.active !== undefined && item.active !== null) {
        item.active_val1 = item.active.toLocaleString();
        item.active_val2 = Math.ceil((item.active / item.population) * 1e5);
    }
    item.active = undefined;
    if (item.recovered !== undefined && item.recovered !== null) {
        item.recovered_val1 = item.recovered.toLocaleString();
        item.recovered_val2 = Math.ceil((item.recovered / item.population) * 1e5);
    }
    item.recovered = undefined;
    item.population = item.population.toLocaleString();
    return item;
}

const executeInDataBase = async (query, params = undefined) => {
    console.info(`Database: ${config.getConnectionString()}`);
    const client = new Client();
    try {
        client.connect();
        if (process.env.PGSCHEMA) {
            console.debug(`Use ${process.env.PGSCHEMA} schema in database`);
            client.query(`SET search_path TO '${process.env.PGSCHEMA}';`);
        }
        console.debug(`Execute query: ${query}`);
        const items = (await client.query(query, params || [])).rows;
        return items;
    } catch (err) {
        console.error(`Error read data from the database.`)
        console.error(err.stack || err);
    } finally {
        try {
            if (client) {
                client.end();
            }
        } catch (err) {
            console.warn(`Close connection error: ${err.stack || err}`);
        }
    }
}

const loadUSData = async (day) => {
    console.info(`Load US data on the ${day} day`);
    return executeInDataBase(
        'SELECT \'US\' as id, location_name as name, population, confirmed, deaths, active, recovered '
        + 'FROM covid_data_stat WHERE country_id = \'US\' AND location_type = \'country\' AND date = $1;',
        [day]);
}

const loadStatesData = async (day) => {
    console.info(`Load States data on the ${day} day`);
    return executeInDataBase(
        'SELECT state_id as id, location_name as name, population, confirmed, deaths, active, recovered '
        + 'FROM covid_data_stat WHERE country_id = \'US\' AND location_type = \'state\' AND date = $1;',
        [day]);
}

const loadCountiesData = async (day) => {
    console.info(`Load Counties data on the ${day} day`);
    return executeInDataBase(
        'SELECT zip, fips, state_id, location_name as name, population, confirmed, deaths, active, recovered '
        + 'FROM covid_data_stat_with_zip '
        + 'WHERE country_id = \'US\' AND location_type = \'county\' AND date = $1 ORDER BY datetime DESC, zip, fips;',
        [day]);
}

const dataMapping = (usData, statesData, countiesData, day) => {
    const result = {date: day}
    console.info(`Creating result data object...`);
    console.debug(`Processing US...`)
    result.US = {state: formatItem(usData), counties: null};
    result.zips = []
    let count = 0;
    for (let county of countiesData) {
        // console.debug(`Processing ${county.zip} zip...`)
        let stateInfo = null;
        for (let state of statesData) {
            if (county.state_id === state.id) {
                stateInfo = formatItem(state);
                break;
            }
        }
        const countyInfo = formatItem(county);
        result.zips.push({state: stateInfo, county: countyInfo});
        count += 1;
    }
    console.info(`Create result data object complete ${count} zips`);
    return result;
}

const loadExecutiveLinks = async () => {
    console.info(`Load Executive Links`);
    return executeInDataBase(`SELECT country_id, state_id, fips, zip, note, url, published FROM covid_info_link;`);
}

const loadZips = async (count=0, shuffle=false) => {
    console.info(`Load Zips`);
    const rawZips = await executeInDataBase(`SELECT zip FROM zip_to_fips WHERE state_id IS NOT NULL;`);
    return rawZips.map((i) => i.zip);
}

const generateDataJson = async (isoDay=undefined) => {
    const queryDay = getDayForApi(isoDay);
    const usData = (await loadUSData(queryDay))[0];
    console.log(`US = ${JSON.stringify(usData, null, 2)}`);
    const statesData = await loadStatesData(queryDay);
    console.log(`States = ${statesData.length}`);
    const countiesData = await loadCountiesData(queryDay);
    console.log(`States = ${countiesData.length}`);
    const resData = await dataMapping(usData, statesData, countiesData, queryDay);
    return resData;
}
const main = async () => {
    try {
        const cv19Data = await generateDataJson();
        const cv19DataResult = JSON.stringify(cv19Data, null, 2)

        console.info(`Write cv19 data to the ${config.data_file} file.`);
        fs.writeFileSync(config.data_file, cv19DataResult);

        const zips = await loadZips();
        console.info(`Write zips to the ${config.zips_file} file.`);
        fs.writeFileSync(config.zips_file, zips.join('\n'));

        const links = await loadExecutiveLinks();
        const linksResult = JSON.stringify(links, null, 2)
        console.info(`Write executive links to the ${config.executive_links_file} file.`);
        fs.writeFileSync(config.executive_links_file, linksResult);
    } catch (err) {
        console.error(`Error: ${err.stack || err}`);
    }
}

if (require.main === module) {
    main();
} else {
    module.exports.generateDataJson = generateDataJson;
    module.exports.loadZips = loadZips;
}