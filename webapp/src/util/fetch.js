const url = process.env.REACT_APP_SERVER_URL;
const jwtToken = process.env.REACT_APP_JWT_TOKEN || false;
const associateView = process.env.REACT_APP_VIEW_ASSOCIATES === '1';
const fetch = window.fetch;
const headers = new Headers();
if (jwtToken) {
  headers.append("Authorization", `Bearer ${jwtToken}`);
}

function fetchWithHeader(url, options) {
  return fetch(url, {
    headers,
    ...options,
  });
}

function getDate() {
  let today = new Date();
  today.setDate(today.getDate() - 1);
  const latest = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  return latest;
}

export async function fetchDataFromUSA(query, rows = 1) {
  const latest = getDate();
  const response = await fetchWithHeader(
    `${url}covid_data_stat?location_type=eq.country&country_id=eq.US&date=eq.${latest}&limit=${rows}`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchDataSources() {
  const response = await fetchWithHeader(`${url}covid_data_source`);
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchDataFromState(query, rows = 1) {
  const latest = getDate();
  const response = await fetchWithHeader(
    `${url}covid_data_stat?country_id=eq.US&location_type=eq.state&date=eq.${latest}&date=eq.${latest}`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchDataFromZip(query, rows = 1) {
  const latest = getDate();
  const response = await fetchWithHeader(
    `${url}covid_data_stat_with_zip?zip=eq.${query}&date=eq.${latest}&limit=${rows}`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchAllCountyData(query, rows = 1) {
  const latest = getDate();
  const response = await fetchWithHeader(
    `${url}covid_data_stat_slim?country_id=eq.US&location_type=eq.county&date=eq.${latest}`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchStateHeadlines(query, rows = 4) {
  const latest = getDate();
  const response = await fetchWithHeader(
    `${url}covid_info_link?country_id=eq.US&state_id=eq.${query}#${latest}`
  );
  const data = await response.json();
  if (data.message) return { error: data.message };
  return { data };
}

export async function findLocationData(query, rows = 1) {
  const latest = getDate();

  const { latitude, longitude } = query;
  console.info(latitude, longitude);
  const upperLat = precise(latitude + 0.12);
  const lowerLat = precise(latitude - 0.12);
  const upperLong = precise(longitude + 0.12);
  const lowerLong = precise(longitude - 0.12);
  const response = await fetchWithHeader(
    `${url}covid_data_stat_with_zip?geo_lat=lt.${upperLat}&geo_lat=gt.${lowerLat}&geo_long=lt.${upperLong}&geo_long=gt.${lowerLong}&date=eq.${latest}&limit=1`
  );
  // NOTE: This is a 3rd party API that can get postal addresses from geoLocation. I've removed it
  // because it is out of our control and may not always be dependable.
  // It is more accurate the approach above and our current location data, however.
  // const response = await fetchWithHeader(
  //   `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  // );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data: data[0] };
}

export async function fetchEmployeeData() {
  if (associateView) {
    const response = await fetch(
      `${process.env.PUBLIC_URL}/data/special-locations.json`
    );
    const data = await response.json();
    if (data.message) return { error: data.message };
    return { data };
  }
  return { data: null };
}

function precise(x) {
  return Number.parseFloat(x).toPrecision(4);
}
