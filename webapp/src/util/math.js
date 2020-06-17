export function diffPercent(today, delta) {
  if (today - delta === 0) return Infinity;
  return delta / (today - delta);
}

// This code is to create a trendline/linear regression for a set of points

export function linearRegression(data, xVar, yVar, xFun = (i) => i, yFun = (i) => i) {
  const lr = {};
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  data.forEach((d) => {
    const x = xFun(d[xVar]);
    const y = yFun(d[yVar]);

    sumX += x;
    sumY += y;

    sumXX += x * x;
    sumYY += y * y;

    sumXY += x * y;
  });

  lr.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  lr.intercept = (sumY - lr.slope * sumX) / n;
  lr.r2 = (n * sumXY - sumX * sumY)
    / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)) ** 2;

  return lr;
}
