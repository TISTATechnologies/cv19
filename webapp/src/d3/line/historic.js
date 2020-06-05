import * as d3 from "d3";
import calcLinear from "./linearReg";

let margin;
let width;
let height;

let legend;
let mouseG;

const findTrueProps = (obj) => Object.entries(obj);

const colorScale = d3.scaleOrdinal(d3.schemeSet2);

function init(pWidth = 900, pHeight = 100) {
  margin = { top: 10, right: 20, bottom: 30, left: 0 };
  width = pWidth - margin.left - margin.right;
  height = pHeight - margin.top - margin.bottom;

  const svg = d3
    .select("#historic")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", "history-graph")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g").attr("class", "axis");
  const svgPaths = svg.append("g").attr("class", "historic-paths");

  mouseG = svg.append("g").attr("class", "mouse-line-effects");

  mouseG
    .append("path")
    .attr("class", "mouse-line")
    .style("stroke", "#888")
    .attr("stroke-width", 1)
    .style("opacity", "1");

  mouseG.append("svg:rect");
}

function draw(w, h, historic = { active: [] }, selected = { trend2: true }) {
  const params = findTrueProps(selected);
  // only return rows with at least some of the data we're looking for.
  const data = historic.active
    ? historic.active
        .filter((d) =>
          params.reduce(
            (acc, [param, isOn]) =>
              acc || (isOn && (d[param] || d[param] === 0)),
            false
          )
        )
        .map((d) => ({ ...d, date: d3.isoParse(d.date) }))
    : [];
  let X = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, w]);
  let scales = params.map(([param]) =>
    d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => +d[param]))
      .range([h, 0])
  );

  d3.select("#historic")
    .select("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom);

  const svgRoot = d3.select("#history-graph");
  const svg = d3.select(".historic-paths");

  svgRoot
    .select(".axis")
    .attr("transform", `translate(0, ${h})`)
    .call(d3.axisBottom(X));

  svg
    .selectAll("path.graphs")
    .data(params)
    .join("path")
    .attr("class", (d) => `graphs ${d[0]}`);
  svg
    .selectAll("path.regression")
    .data(params)
    .join("path")
    .attr("class", (d) => `regression ${d[0]}`);

  let mouseG = d3.select(".mouse-line-effects");

  params.forEach((p, i) => {
    const [param, isOn] = p;
    const filtered = data.filter((d) => isOn && (d[param] || d[param] === 0));
    const Y = scales[i];
    const path = svg
      .select(`path.graphs.${param}`)
      .datum(filtered)
      .attr("fill", "none")
      .attr("stroke", (d) => colorScale(i))
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          // .curve(d3.curveMonotoneX)
          .x((d) => X(d.date))
          .y((d) => Y(d[param]))
      );

    let lg = calcLinear(filtered, "date", param, Date.parse);
    let regression_line = d3
      .line()
      .x((d) => X(d.date))
      .y((d) => Y(lg.intercept + lg.slope));
    svg
      .select(`path.regression.${param}`)
      .attr("stroke", (d) => colorScale(i))
      .attr("stroke-width", 1)
      .attr("d", regression_line);
  });
  const mousePerLine = mouseG
    .selectAll(".mouse-per-line")
    .data(params)
    .join((enter) => {
      const e = enter
        .append("g")
        .attr("class", "mouse-per-line")
        .attr("transform", "scale(0)");
      e.append("circle")
        .attr("r", 5)
        .attr("stroke", (d, i) => colorScale(i))
        .attr("fill", (d, i) => colorScale(i))
        .attr('fill-opacity', 0.5)
        .attr("stroke-width", 3);
      e.append("text")
        .attr("transform", "translate(10,10)")
        .attr("fill", "white")
        .style("font-size", "20px")
        .style("text-shadow", "3px 3px 3px #222")
        .text("");
      return e;
    });

  mouseG
    .select("rect")
    .attr("width", w )
    .attr("height", h* 1.5)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .raise()
    .on('mouseleave', () => {
      d3.selectAll(".mouse-per-line").style('visibility', 'hidden')
    })
    .on("mousemove mouseenter", function () {
      let [mouseX] = d3.mouse(this);
      d3.select(".mouse-line").attr("d", () => `M${mouseX},${h} ${mouseX},0`);
      const dateX = X.invert(mouseX);
      const paramValues = scales.map((scale, i) => {
        const [param, isOn] = params[i];
        if (!isOn) return [false];
        const idX = d3.bisectLeft(
          data.map((d) => d.date).sort(d3.ascending),
          dateX
        );
        const id = data.length - idX; // I have to reverse the index for some reason
        return id > -1 && id < data.length
          ? [data[id]["date"], data[id][param]]
          : [false];
      });
      d3.selectAll(".mouse-per-line")
        .data(paramValues)
        .style('visibility', 'visible')
        .attr("transform", ([x, y], i) =>
          y ? `translate(${X(x)},${scales[i](y)})` : "scale(0)"
        )
        .select("text")
        .text((d, i) => i < 3 ? d3.format(".1%")(d[1]) : d3.format('.3s')(d[1]));
    });
}

export { init, draw };
