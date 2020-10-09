import { fetchFipsFromZip } from './fetch';

export function createUrl(zipCode, county) {
  const head = zipCode ? `${zipCode}-` : '';
  const tail = county
    .split(/ |,/)
    .filter((x) => x)
    .join('-')
    .toLowerCase();
  return `${head}${tail}`;
}

export function createFipsUrl(fips) {
  if (!fips) return '';
  return `fips-${fips}`;
}

export async function decodeUrl(url) {
  const [zip, firstword] = url.toLowerCase().split('-');
  if (zip === 'fips') return ['', firstword];
  if (!Number.parseInt(zip, 10)) return ['', ''];
  const fipsList = await fetchFipsFromZip(zip);
  if (fipsList) {
    const matches = fipsList.filter((f) => f.zip === zip);
    if (matches) {
      const match = matches.find((f) => f.name.toLowerCase().split(' ')[0] === firstword);
      if (match) return [zip, match.fips];
      return [zip, matches[0].fips];
    }
  }
  return ['', ''];
}
