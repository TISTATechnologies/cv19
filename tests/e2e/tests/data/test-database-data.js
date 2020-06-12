const { Config } = require('../../helpers/config');
const { exec } = require('../../helpers/db-helper');
const countiesWithoutData = require('./us-counties-without-data.json')

const config = new Config();
const log = config.log;
beforeAll(() => {
    jest.setTimeout(config.apiTimeout);
    log.info(`Check Covid-19 data in database`)
})

describe("Check common tables in database", () => {
    it(`US state count correct`, async () => {
        const sql = 'SELECT type, COUNT(*) FROM state GROUP BY type ORDER BY type;'
        const res = await exec(sql);
        expect(res).toHaveLength(4); 
        expect(res[0]['type']).toEqual('associated state'); 
        expect(res[0]['count']).toEqual('3'); 
        expect(res[1]['type']).toEqual('federal district'); 
        expect(res[1]['count']).toEqual('1'); 
        expect(res[2]['type']).toEqual('state'); 
        expect(res[2]['count']).toEqual('50'); 
        expect(res[3]['type']).toEqual('territory'); 
        expect(res[3]['count']).toEqual('5'); 
    });

    it(`US counties count correct`, async () => {
        const sql = 'SELECT s.type, COUNT(r.id) FROM region r '
            + 'INNER JOIN state s ON s.id = r.state_id AND s.country_id = r.country_id '
            + 'WHERE r.type = \'county\' AND r.country_id = \'US\' GROUP BY s.type ORDER BY s.type;'
        const res = await exec(sql);
        expect(res).toHaveLength(3); 
        expect(res[0]['type']).toEqual('federal district'); 
        expect(res[0]['count']).toEqual('1'); 
        expect(res[1]['type']).toEqual('state'); 
        expect(res[1]['count']).toEqual('3141'); 
        expect(res[2]['type']).toEqual('territory'); 
        expect(res[2]['count']).toEqual('78');              // we have counties for PR territory
        let total = 0;
        for (let i = 0; i < res.length; i += 1) {
            total += +res[i]['count'];
        }
        expect(total).toEqual(3220);
    });

    it(`All US counties have zip codes`, async () => {
        const sql = 'SELECT r.* FROM region r '
            + 'LEFT JOIN zip_to_fips zf '
            + '  ON r.country_id = zf.country_id AND r.state_id = zf.state_id AND r.fips = zf.fips '
            + 'WHERE r.type = \'county\' AND zf.zip IS NULL;';
        const res = await exec(sql);
        expect(res).toHaveLength(0); 
    });

    it(`All US zip codes have counties codes`, async () => {
        const sql = 'SELECT zf.* FROM zip_to_fips zf '
            + 'INNER JOIN region r ON r.country_id = zf.country_id AND r.state_id = zf.state_id AND r.fips = zf.fips '
            + 'WHERE r.id IS NULL;';
        const res = await exec(sql);
        expect(res).toHaveLength(0); 
    });

    it(`All countries should have population (except 17 countries)`, async () => {
        const sql = 'SELECT c.name FROM country c '
            + 'LEFT JOIN region_population rp ON rp.country_id = c.id '
            + '  AND (rp.fips = \'00000\' or rp.fips IS NULL) AND rp.state_id is null '
            + 'WHERE rp.population IS NULL;'
        const res = await exec(sql);
        expect(res).toHaveLength(17); 

        const sql2 = 'SELECT c.name FROM country c '
            + 'LEFT JOIN region_population rp ON rp.country_id = c.id '
            + '  AND (rp.fips = \'00000\' or rp.fips IS NULL) AND rp.state_id is null '
            + 'WHERE rp.population IS NULL '
            + '  AND c.id NOT IN (\'AQ\', \'AX\', \'BV\', \'CC\', \'CX\', \'GG\', \'GS\', \'GZ\', \'HM\', \'IO\', '
            + '  \'JE\', \'NF\', \'PN\', \'SJ\', \'TF\', \'UM\', \'XK\');'
        const res2 = await exec(sql2);
        expect(res2).toHaveLength(0); 
    });

    it(`All US states should have popultion`, async () => {
        const sql = 'SELECT s.id, s.name, s.fips FROM state s '
            + 'LEFT JOIN region_population rp ON rp.country_id = s.country_id '
            + '  AND rp.state_id = s.id AND rp.fips like \'000%\' '
            + 'WHERE rp.population IS NULL AND s.country_id = \'US\' AND s.type in (\'state\', \'federal district\');';
        const res = await exec(sql);
        expect(res).toHaveLength(0); 
    });

    it(`All US counties should have popultion`, async () => {
        const sql = 'SELECT s.country_id, s.name, r.name, r.fips FROM region r '
            + 'INNER JOIN state s ON s.id = r.state_id AND s.country_id = r.country_id '
            + 'LEFT JOIN region_population rp ON rp.country_id = r.country_id '
            + '  AND rp.state_id = r.state_id AND rp.fips = r.fips '
            + 'WHERE r.country_id = \'US\' AND r.type = \'county\' AND rp.population IS NULL AND s.id <> \'PR\';';
        const res = await exec(sql);
        expect(res).toHaveLength(0); 
    });
});

describe("Check Covid-19 data in database", () => {
    const day = config.testDate;
    it(`All US states should have data on ${day} day`, async () => {
        const sql = 'SELECT s.id, s.country_id, s.name, s.fips, $1 AS date, s.type '
            + 'FROM state s LEFT JOIN covid_data_stat dz '
            + 'ON dz.state_id = s.id AND dz.location_type = \'state\' AND dz.date = $1 '
            + 'WHERE s.type in (\'state\', \'federal district\') AND dz IS NULL;'
        const res = await exec(sql, [day]);
        expect(res).toHaveLength(0);
    });

    it(`All US counties should have data on ${day} day (except ${countiesWithoutData.length} counties from us-counties-without-data.json file)`, async () => {
        const fips = countiesWithoutData.map((i) => `'${i['fips']}'`);
        const sql = 'SELECT r.state_id, r.fips FROM region r '
            + 'INNER JOIN state s ON r.state_id = s.id AND r.country_id = s.country_id '
            + '  AND r.type = \'county\' AND s.type IN (\'state\', \'federal district\') '
            + 'LEFT JOIN covid_data_stat dz '
            + ' ON dz.country_id = s.country_id AND dz.fips = r.fips AND dz.location_type = \'county\' '
            + 'AND dz.date = $1 '
            + `WHERE dz IS NULL AND r.fips NOT IN (${fips.join(',')}) `
            + 'ORDER BY s.country_id, s.id, r.fips;'
        const res = await exec(sql, [day]);
        expect(res).toHaveLength(0);
    });
});
