export default (data, xVar, yVar, xFun = (i) => i, yFun = (i) => i) => {
  let lr = {};
  let n = data.length;
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let sum_yy = 0;

  data.forEach((d) => {
    let x = xFun(d[xVar]);
    let y = yFun(d[yVar]);

    sum_x += x;
    sum_y += y;

    sum_xx += x * x;
    sum_yy += y * y;

    sum_xy += x * y;
  });

  lr.slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  lr.intercept = (sum_y - lr.slope * sum_x) / n;
  lr.r2 = Math.pow(
    (n * sum_xy - sum_x * sum_y) /
      Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),
    2
  );

  return lr;
};
