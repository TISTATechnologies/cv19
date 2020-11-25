export function removeDuplicateMetros(array) {
  return array.filter((c, index) => (c.fips.includes('US') ? array.findIndex((d) => d.name === c.name) === index : true));
}
export function findFirst(array, target) {
  const l = target.length;
  if (!array.length) return null;
  return array.find((a) => a.zip.substring(0, l) === target);
}

export function joinTables(lookupTable, mainTable, lookupKey, mainKey, select) {
  const l = lookupTable.length;
  const m = mainTable.length;
  const lookupIndex = [];
  const output = [];
  for (let i = 0; i < l; i += 1) {
    // loop through l items
    const row = lookupTable[i];
    lookupIndex[row[lookupKey]] = row; // create an index for lookup table
  }
  for (let j = 0; j < m; j += 1) {
    // loop through m items
    const y = mainTable[j];
    const x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
    output.push(select(y, x)); // select only the columns you need
  }
  return output;
}
