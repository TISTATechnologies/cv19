import stateFips from '../resources/stateFips';

let common = window.CONFIG.commonDataUrl || process.env.REACT_APP_COMMON_DATA_URL;
let covid = window.CONFIG.covidDataUrl || process.env.REACT_APP_COVID_DATA_URL;
const internal = window.CONFIG.internalDataUrl || process.env.REACT_APP_INTERNAL_DATA_URL;
const jwtToken = window.CONFIG.jwtToken || process.env.REACT_APP_JWT_TOKEN || false;
const associateView = (window.CONFIG.viewAssociates || process.env.REACT_APP_VIEW_ASSOCIATES) === '1';
const stamp = window.CONFIG.timestamp || process.env.REACT_APP_TIMESTAMP;
const { fetch } = window;

const headers = new Headers();

// Add trailing slashes to paths if missing
if (common.substr(-1) !== '/') {
  common = `${common}/`;
}
if (covid.substr(-1) !== '/') {
  covid = `${covid}/`;
}

if (jwtToken) {
  headers.append('Authorization', `Bearer ${jwtToken}`);
}

function fetchWithHeader(url, options) {
  return fetch(`${url}?ts=${stamp}`, {
    headers,
    ...options,
  });
}

export function getDate() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  const latest = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  return latest;
}

export async function fetchDataFromUSA() {
  const response = await fetchWithHeader(`${covid}daily/latest/us.json`);
  if (!response.ok) return { error: 'Could not collect USA data.' };
  const data = await response.json();
  return { data };
}

export async function fetchDataSources() {
  const response = await fetchWithHeader(`${covid}source/latest.json`);
  if (!response.ok) return { error: "Could not collect data sources' infomation." };
  const data = await response.json();
  return { data };
}

export async function fetchDataFromState() {
  const response = await fetchWithHeader(`${covid}daily/latest/us/all-states.json`);
  if (!response.ok) return { error: "Could not collect all states' data." };
  const data = await response.json();
  return { data };
}

export async function fetchFipsFromZip(query) {
  const first = query.slice(0, 1);
  const chunk = query.slice(0, 3);
  if (chunk.length < 3) return [];
  const response = await fetch(`${common}us/zip/${first}/${chunk}.json`);
  try {
    const fips = await response.json();
    return fips;
  } catch {
    // console.error(`No fips for this Zip group: ${chunk}`);
    return [];
  }
}

export async function fetchDataFromFips(lFips) {
  const fips = lFips.toUpperCase();
  const stateCode = fips.slice(0, 2);
  const state = stateFips.find((x) => x[2] === stateCode);
  // console.log(`%c${state}`, 'color: orange');
  if (!state) return { data: [] };
  const stateAbbr = state[1].toLowerCase();
  const response = await fetchWithHeader(`${covid}daily/latest/us/${stateAbbr}/${fips}.json`);
  if (!response.ok) return { error: `Could not collect data for ${stateAbbr}: ${fips}.` };
  const data = await response.json();
  return { data };
}

export async function fetchTrendFromFips(lFips) {
  const fips = lFips.toUpperCase();
  const stateCode = fips.slice(0, 2);
  const state = stateFips.find((x) => x[2] === stateCode);
  const stateAbbr = state[1].toLowerCase();
  const isUsa = stateCode === '00';
  const url = isUsa
    ? `${covid}trend/latest/us.json`
    : `${covid}trend/latest/us/${stateAbbr}/${fips}.json`;
  const response = await fetchWithHeader(url);
  if (!response.ok) return { error: `Could not collect trend data for ${stateAbbr}: ${fips}.` };
  const data = await response.json();
  return { data };
}

export async function fetchAllCountyData() {
  const response = await fetchWithHeader(`${covid}daily/latest/us/all-counties.json`);
  if (!response.ok) return { error: "Could not collect all counties' data." };
  const data = await response.json();
  return { data };
}

export async function fetchStateHeadlines(query) {
  const response = await fetchWithHeader(
    `${covid}executive-orders/latest/us/${query.toLowerCase()}.json`,
  );
  const data = await response.json();
  if (!response.ok) return { error: `Could not collect trend data for ${query}.` };
  if (data.message) return { error: data.message };
  return { data };
}

export async function findLocationData(query) {
  const { latitude, longitude } = query;
  // console.info(latitude, longitude);
  // This uses the gov's location finder
  const response = await fetch(
    `https://geo.fcc.gov/api/census/area?format=json&lat=${latitude}&lon=${longitude}`,
  );
  if (!response.ok) return { message: 'Could not find location data.' };
  const data = await response.json();
  return { data: data.results[0] };
}

export async function fetchEmployeeData() {
  try {
    if (associateView && internal) {
      const response = await fetch(`${internal}/special-locations.json`);
      const data = await response.json();
      if (data.message) return { error: data.message };
      return { data };
    }
  } catch (ex) {
    console.error(ex);
  }
  return { data: null };
}

export async function fetchHistoric(fips) {
  let countyResponse;
  let stateResponse = false;
  if (!fips) {
    countyResponse = await fetchWithHeader(`${covid}history/us.json`);
  } else {
    const stateCode = fips.slice(0, 2).toUpperCase();
    const state = stateFips.find((x) => x[2] === stateCode);
    const stateAbbr = state[1].toLowerCase();
    countyResponse = await fetchWithHeader(`${covid}history/us/${stateAbbr}/${fips}.json`);
    stateResponse = await fetchWithHeader(`${covid}history/us/${stateAbbr}.json`);
  }
  if (!countyResponse.ok) return { error: `Could not collect historic data for ${fips}.` };
  const data = await countyResponse.json();
  const sData = stateResponse ? await stateResponse.json() : undefined;
  return { data, sData };
}

export async function fetchAidData() {
  try {
    if (internal) {
      const response = await fetch(`${internal}/aidData.json`);
      const data = await response.json();
      if (data.message) return { error: data.message };
      return { data };
    }
  } catch (ex) {
    console.error(ex);
  }
  return { data: null };
}

export async function fetchGeo() {
  const CountyMap = await fetch(`${common}us/map/gz_2010_us_050_00_20m.json`);
  const StateMap = await fetch(`${common}us/map/gz_2010_us_040_00_20m.json`);
  const MetroMap = await fetch(`${common}us/map/metro_areas.json`);
  const data = [await CountyMap.json(), await StateMap.json(), await MetroMap.json()];
  return { data };
}

export async function fetchMetroZones() {
  const response = await fetchWithHeader(`${common}us/areas.json`);
  if (!response.ok) return { error: 'Could not find metro zones.' };
  const data = await response.json();
  return { data };
}
