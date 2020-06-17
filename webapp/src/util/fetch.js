import stateFips from '../resources/stateFips';

let api = process.env.REACT_APP_SERVER_URL || '';
let common = process.env.REACT_APP_COMMON_DATA_URL || '';
let covid = process.env.REACT_APP_COVID_DATA_URL || '';
const jwtToken = process.env.REACT_APP_JWT_TOKEN || false;
const associateView = process.env.REACT_APP_VIEW_ASSOCIATES === '1';
const stamp = process.env.REACT_APP_TIMESTAMP || '';
const { fetch } = window;
const headers = new Headers();

// Add trailing slashes to paths if missing
if (common.substr(-1) !== '/') {
  common = `${common}/`;
}
if (covid.substr(-1) !== '/') {
  covid = `${covid}/`;
}
if (api.substr(-1) !== '/') {
  api = `${api}/`;
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
  if (!response) return { error: 'problem' };
  const data = await response.json();
  return { data };
}

export async function fetchDataSources() {
  const response = await fetchWithHeader(`${covid}source/latest.json`);
  if (!response) return { error: 'problem' };
  const data = await response.json();
  return { data };
}

export async function fetchDataFromState() {
  const response = await fetchWithHeader(`${covid}daily/latest/us/all-states.json`);
  if (!response) return { error: 'problem' };
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

export async function fetchDataFromFips(fips) {
  const stateCode = fips.slice(0, 2);
  const state = stateFips.find((x) => x[2] === stateCode);
  if (!state) return { data: [] };
  const stateAbbr = state[1].toLowerCase();
  const response = await fetchWithHeader(`${covid}daily/latest/us/${stateAbbr}/${fips}.json`);
  if (!response) return { error: 'problem' };
  const data = await response.json();
  return { data };
}

export async function fetchTrendFromFips(fips) {
  const stateCode = fips.slice(0, 2);
  const state = stateFips.find((x) => x[2] === stateCode);
  const stateAbbr = state[1].toLowerCase();
  const response = await fetchWithHeader(`${covid}trend/latest/us/${stateAbbr}/${fips}.json`);
  if (!response) return [{ error: 'problem' }];
  const data = await response.json();
  return { data };
}

export async function fetchAllCountyData() {
  const response = await fetchWithHeader(`${covid}daily/latest/us/all-counties.json`);
  if (!response) return { error: 'problem' };
  const data = await response.json();
  return { data };
}

export async function fetchStateHeadlines(query) {
  const response = await fetchWithHeader(
    `${covid}executive-orders/latest/us/${query.toLowerCase()}.json`,
  );
  const data = await response.json();
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
  if (!response) return { message: 'problem' };
  const data = await response.json();
  return { data: data.results[0] };
}

export async function fetchEmployeeData() {
  if (associateView) {
    const response = await fetch(`${process.env.PUBLIC_URL}data/special-locations.json`);
    const data = await response.json();
    if (data.message) return { error: data.message };
    return { data };
  }
  return { data: null };
}

export async function fetchHistoric(fips) {
  let response;
  if (!fips) {
    response = await fetchWithHeader(`${covid}history/active/us.json`);
  } else {
    const stateCode = fips.slice(0, 2);
    const state = stateFips.find((x) => x[2] === stateCode);
    const stateAbbr = state[1].toLowerCase();
    response = await fetchWithHeader(`${covid}history/active/us/${stateAbbr}/${fips}.json`);
  }
  if (!response) return { error: 'problem' };
  const data = await response.json();
  return { data };
}

export async function fetchAidData() {
  const response = await fetch(`${process.env.PUBLIC_URL}data/aidData.json`);
  const data = await response.json();
  if (data.message) return { error: data.message };
  return { data };
}

export async function fetchGeo() {
  const CountyMap = await fetch(`${common}us/map/gz_2010_us_050_00_20m.json`);
  const StateMap = await fetch(`${common}us/map/gz_2010_us_040_00_20m.json`);
  const data = [await CountyMap.json(), await StateMap.json()];
  return { data };
}
