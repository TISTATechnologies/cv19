export const sortDate = (a, b) => {
  const aDate = Date.parse(a.created);
  const bDate = Date.parse(b.created);
  return bDate - aDate;
};

export const daysDiff = (date1, date2) => {
  const toDays = (dt) => dt / (1000 * 60 * 60 * 24);
  return Math.abs(toDays(date1) - toDays(date2));
};

export const determineAge = (date) => {
  const d = Date.parse(date);
  return daysDiff(d, Date.now());
};
