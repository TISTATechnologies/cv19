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
  const [zip, firstword, ...rest] = url.toLowerCase().split('-');
  if (zip === 'fips') return ['', firstword];
  if (!Number.parseInt(zip, 10)) return ['', ''];
  const fipsList = await fetchFipsFromZip(zip);
  if (fipsList) {
    const matches = fipsList.filter((f) => f.zip === zip);
    if (matches) {
      const match = matches.find((f) => {
        const m = f.name.toLowerCase().split(' ').join('-');
        const t = [firstword, ...rest].join('-');
        const l = Math.min(m.length, t.length);
        return t.slice(0, l) === m.slice(0, l);
      });
      if (match) return [zip, match.fips];
      return [zip, matches[0].fips];
    }
  }
  return ['', ''];
}
