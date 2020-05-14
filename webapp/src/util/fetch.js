const url = process.env.REACT_APP_SERVER_URL;
const jwtToken = process.env.REACT_APP_JWT_TOKEN || false;
const associateView = process.env.REACT_APP_VIEW_ASSOCIATES === "1";
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
  const response = await fetchWithHeader(
    `${url}covid_data_stat_latest?location_type=eq.country&country_id=eq.US&limit=${rows}`
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
  const response = await fetchWithHeader(
    `${url}covid_data_stat_latest?country_id=eq.US&location_type=eq.state`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchFipsFromZip(query) {
  const first = query.slice(0, 1);
  const chunk = query.slice(0, 3);
  if (chunk.length < 3) return [];
  const response = await fetch(
    `${process.env.REACT_APP_COMMON_DATA_URL}/us/zip/${first}/${chunk}.json`
  );
  try {
    const fips = await response.json();
    return fips;
  } catch {
    console.error(`No fips for this Zip group: ${chunk}`);
    return [];
  }
}

export async function fetchDataFromFips(fips, rows = 1) {
  const response = await fetchWithHeader(
    `${url}covid_data_stat_latest?fips=eq.${fips}&limit=${rows}`
  );
  // console.log(`%c${response}`, "color: magenta");
  if (!response) return { error: "problem" };
  const data = await response.json();
  return { data };
}

export async function fetchAllCountyData(query, rows = 1) {
  const response = await fetchWithHeader(
    `${url}covid_data_stat_latest?country_id=eq.US&location_type=eq.county`
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
  const { latitude, longitude } = query;
  console.info(latitude, longitude);
  // This uses the gov's location finder
  const response = await fetch(
    `https://geo.fcc.gov/api/census/area?format=json&lat=${latitude}&lon=${longitude}`
  );
  if (!response) return { message: "problem" };
  const data = await response.json();
  return { data: data.results[0] };
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
