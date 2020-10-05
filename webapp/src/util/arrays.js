export function removeDuplicateMetros(array) {
  return array.filter((c, index) => (c.fips.includes('US') ? array.findIndex((d) => d.name === c.name) === index : true));
}
export function findFirst(array, target) {
  const l = target.length;
  if (!array.length) return null;
  return array.find((a) => a.zip.substring(0, l) === target);
}
