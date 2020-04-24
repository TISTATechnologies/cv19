import CountyMap from "./gz_2010_us_050_00_20m.json";
import StateMap from "./gz_2010_us_040_00_20m.json";
// import EmpCounties from "./employeeCounties";
import * as d3 from "d3";

const countyGeo = CountyMap.features.map((x) => ({
  ...x,
  fips: x.properties.STATE + x.properties.COUNTY,
}));
const stateGeo = StateMap.features.map((x) => ({
  ...x,
  fips: x.properties.STATE,
}));

const bigFormat = new Intl.NumberFormat("en", {});

const bivarColors = [
  "#ffffff",
  "#e4acac",
  "#c85a5a",
  "#b0d5df",
  "#ad9ea5",
  "#985356",
  "#64acbe",
  "#627f8c",
  "#574249",
];
let confirmedColor = d3
  .scaleSequentialLog(d3.interpolateYlOrRd)
  .domain([10, 1000])
  .unknown("#999")
  .nice();

let ratioColor = d3
  .scaleSequentialLog(d3.interpolateBuPu)
  .domain([10, 1000])
  .unknown("#999")
  .nice();

let assocCountScale = d3.scaleThreshold().domain([20, 50]).range(d3.range(3));

let ratioImpactScale = d3
  .scaleThreshold()
  .domain([500, 1000])
  .range(d3.range(3));

let associateImpactColor = (value) => {
  if (!value || !value[0] | !value[1]) return "#999";
  let [a, b] = value;
  let left = ratioImpactScale(b);
  let right = assocCountScale(a);
  return bivarColors[left + right * 3];
};

function showToolTip(d, i) {
  const t = d3.select(".tooltip");
  const x = d3.event.pageX;
  const ttWidth = 150;
  const xAdjust = x + ttWidth + 25 < window.innerWidth ? x + 25 : x - 150;
  t.html(buildTooltipText(d));
  t.style("top", `${d3.event.pageY - 15}px`)
    .style("left", `${xAdjust}px`)
    .style("visibility", "visible")
    .style("opacity", "1");
}

function buildTooltipText({
  population,
  properties,
  confirmed,
  deaths,
  count,
  associateImpact,
  aRate,
  active,
}) {
  let string = "";
  if (!Number.isNaN(Number.parseInt(population, 10))) {
    string += `<div class='tooltip-population'>Pop: ${bigFormat.format(
      population
    )}</div>`;
  } else {
    string += "NO DATA";
  }
  if (!Number.isNaN(Number.parseInt(count, 10))) {
    string += `<hr/><div>TISTA Assoc.: ${bigFormat.format(count)}</div>`;
    // string += `<div>RATIO.: ${bigFormat.format(associateImpact)}</div>`;
  }
  if (!Number.isNaN(Number.parseInt(confirmed, 10))) {
    string += `<hr/><div class='tooltip-confirmed'>Confirmed: ${bigFormat.format(
      confirmed
    )}</div>`;
    if (confirmed / population) {
      let cRate = Math.ceil((confirmed / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(cRate)}</div>`;
    }
  }
  if (!Number.isNaN(Number.parseInt(deaths, 10))) {
    string += `<hr/><div class='tooltip-deaths'>Deaths: ${bigFormat.format(
      deaths
    )}</div>`;
    if (deaths / population) {
      let dRate = Math.ceil((deaths / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(dRate)}</div>`;
    }
  }
  if (!Number.isNaN(Number.parseInt(active, 10))) {
    string += `<hr/><div class='tooltip-active'>Active: ${bigFormat.format(
      active
    )}</div>`;
    if (active / population) {
      let aRate = Math.ceil((active / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(aRate)}</div>`;
    }
  }
  return `<div><strong>${properties.NAME}</strong></div>${string}`;
}

function hideToolTip() {
  const t = d3
    .select(".tooltip")
    .style("visibility", "hidden")
    .style("opacity", "0");
}

function joinTables(lookupTable, mainTable, lookupKey, mainKey, select) {
  var l = lookupTable.length,
    m = mainTable.length,
    lookupIndex = [],
    output = [];
  for (var i = 0; i < l; i++) {
    // loop through l items
    var row = lookupTable[i];
    lookupIndex[row[lookupKey]] = row; // create an index for lookup table
  }
  for (var j = 0; j < m; j++) {
    // loop through m items
    var y = mainTable[j];
    var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
    output.push(select(y, x)); // select only the columns you need
  }
  return output;
}

const projection = d3.geoAlbersUsa();
// Create GeoPath function that uses built-in D3 functionality to turn
// lat/lon coordinates into screen coordinates
const geoPath = d3.geoPath().projection(projection);

function initMap(width = 950, height = 300) {
  console.log(`%cINIT MAP `, "color: limegreen");

  const svg = d3
    .selectAll("section")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "d3Map");

  const legend = d3
    .selectAll("section")
    .append("div")
    .attr("class", "legend-holder")
    .append("div")
    .attr("class", "d3Legend");

  const bivLegend = d3
    .selectAll(".legend-holder")
    .append("div")
    .attr("class", "d3BivLegend");
  // .attr("style", "position: absolute")

  const g = svg.append("g");
  const counties = g.append("g").attr("class", "counties");
  const states = g.append("g").attr("class", "states");
  const circles = g.append("g").attr("class", "circles");
  const tooltip = d3
    .select("section")
    .append("div")
    .attr("class", "tooltip")
    .attr("y", 30)
    .style("visibility", "hidden")
    .style("opacity", "0");

  states
    .selectAll("path")
    .data(stateGeo)
    .join("path")
    .attr("d", geoPath)
    .attr("fill", "none")
    .attr("stroke", "#222");
}

function getAllMapData(countyHeat, EmpCounties) {
  console.log(`%cGet ALL MAP DATA`, "color: orange");
  console.log(`%c${!!EmpCounties}`, "color: orange");
  let finalCounty;
  if (countyHeat.length) {
    finalCounty = joinTables(countyHeat, countyGeo, "fips", "fips", (g, h) => ({
      ...g,
      confirmed: h !== undefined ? h.confirmed : undefined,
      active: h !== undefined ? h.active : undefined,
      recovered: h !== undefined ? h.recovered : undefined,
      deaths: h !== undefined ? h.deaths : undefined,
      population: h !== undefined ? h.population : undefined,
      geo_lat: h !== undefined ? h.geo_lat : undefined,
      geo_long: h !== undefined ? h.geo_long : undefined,
      ratio: h !== undefined ? (h.confirmed / h.population) * 1e5 : undefined,
    }));
    if (EmpCounties) {
      finalCounty = joinTables(
        EmpCounties,
        finalCounty,
        "fips",
        "fips",
        (g, h) => ({
          ...g,
          count: h !== undefined ? h.value : undefined,
          associateRatio:
            h !== undefined ? (h.value * g.ratio) / 1e3 : undefined,
        })
      );
    }
  } else {
    finalCounty = countyGeo;
  }
  return finalCounty;
}

function drawMap(width = 950, height = 300, location = {}, countyHeat, myMap) {
  console.log(`%cDRAW MAP: ${myMap} `, "color: magenta");

  // Create SVG
  const svg = d3
    .selectAll(".d3Map")
    .attr("width", width)
    .attr("height", height);

  const legend = d3.select(".d3Legend").attr("width", width);

  const g = svg.select("g");
  const counties = g.select(".counties");
  const states = g.select(".states");
  const circles = g.select(".circles");
  const tooltip = d3.select(".tooltip");

  const confirmed = countyHeat.map((x) => x.confirmed || 1); // log domain can't be 0
  const confirmedExtend = d3.extent(confirmed);
  confirmedColor = confirmedColor.domain(confirmedExtend);

  const ratio = countyHeat.map((x) => x.ratio || 1); // log domain can't be 0
  const ratioExtend = d3.extent(ratio);
  ratioColor = ratioColor.domain(ratioExtend);

  // Append empty placeholder g element to the SVG
  // g will contain geometry elements
  let currentColorFunction = confirmedColor;
  let scaleValues;
  switch (myMap) {
    case "ratio":
      currentColorFunction = ratioColor;
      scaleValues = "log";
      break;
    case "associateImpact":
      currentColorFunction = confirmedColor;
      scaleValues = "linear";
      break;
    default:
      currentColorFunction = confirmedColor;
      scaleValues = "log";
  }

  const colorFunction = (d) => {
    switch (myMap) {
      case "ratio":
        return ratioColor(d.ratio);
      case "associateImpact":
        return associateImpactColor([d.count, d.ratio]);
      case "confirmed":
      default:
        return confirmedColor(d.confirmed);
    }
  };

  const t = d3.transition().duration(400);

  // Classic D3... Select non-existent elements, bind the data, append the elements, and apply attributes
  counties
    .selectAll("path")
    .data(countyHeat, (d) => d.fips)
    .join("path")
    .attr("class", (d) => `fips${d.fips} county`)
    .on("mouseout", hideToolTip)
    .on("mousemove", showToolTip)
    .attr("stroke-linejoin", "round")
    .attr("d", geoPath)
    .transition(t)
    .delay((d, i) => (i % 10) * 50)
    .attr("fill", colorFunction)
    .attr("opacity", "0.9")
    .attr("stroke", "#444")
    .attr("stroke-opacity", 0.2);

  const zoom = d3.zoom().scaleExtent([1, 15]).on("zoom", zoomed);

  function drawLocation(location) {
    counties
      .select(`.fips${location.fips}`)
      .attr("opacity", "1")
      .attr("stroke", "#00BCD4")
      .attr("stroke-width", 0.7)
      .attr("stroke-opacity", 1)
      .attr("class", "active");
  }
  function zoomToUsa() {
    const moveX = Math.min(0, width / 2);
    const moveY = Math.min(0, height / 2);

    svg
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(moveX, moveY).scale(1));
  }
  function toLocation(location) {
    // console.log(`%cTransition? ${location.location_name}`, "color: lime");
    const [x, y] = projection([location.geo_long, location.geo_lat]);
    const scale = 10;
    // const scale = projection.scale()
    const offsetX = x * scale;
    const offsetY = y * scale;
    const moveX = Math.min(0, width / 2 - offsetX);
    const moveY = Math.min(0, height / 2 - offsetY);
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(moveX, moveY).scale(scale)
      );
  }

  function zoomed() {
    const { transform } = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  svg.call(zoom);
  if (location.geo_lat) {
    toLocation(location);
    drawLocation(location);
  } else {
    zoomToUsa();
  }

  if (myMap !== "associateImpact") {
    d3.select(".d3BivLegend").style("visibility", "hidden");
    d3.select(".d3Legend").style("visibility", "visible");
    betterLegend({
      div: d3.select(".d3Legend"),
      width,
      height: 20,
      colorScale: currentColorFunction,
      scaleValues,
    });
  } else {
    d3.select(".d3BivLegend").style("visibility", "visible");
    d3.select(".d3Legend").style("visibility", "hidden");
    bivarLegend({
      div: d3.select(".d3BivLegend"),
    });
  }
  // Might use for employee concentration
  function drawCircles({ group, colorScale, data }) {
    let adjustedData = [];
    if (myMap === "associateImpact") {
      adjustedData = data
        .filter((d) => d.geo_lat && d.geo_long && d.count)
        .map((d) => {
          const [x, y] = projection([d.geo_long, d.geo_lat]);
          return { x, y, count: d.count, confirmed: d.confirmed };
        });
    }

    const squareScale = d3.scaleSqrt().domain([1, 200]).range([2, 30]);
    group
      .selectAll("circle")
      .data(adjustedData)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => squareScale(d.count))
      .style("fill", (d) => colorScale(d.confirmed))
      .style("stroke", (d) => colorScale(d.confirmed))
      .attr("fill-opacity", 0.2)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 0.5);
  }
}

// LEGEND
function betterLegend({
  div,
  width,
  height,
  colorScale,
  scaleValues = "linear",
}) {
  let data;
  let steps;
  let textTransform;
  if (scaleValues === "log") {
    steps = Math.ceil(Math.log10(d3.max(colorScale.domain()))) || 4;
    data = Array(steps)
      .fill(0)
      .map((x, i) => 10 ** (i + 1));
    textTransform = (d) => `${d3.format("~s")(d / 10)} - ${d3.format("~s")(d)}`;
  } else {
    steps = Math.ceil(d3.max(colorScale.domain()) / 10) || 4;
    data = Array(steps + 1)
      .fill(0)
      .map((x, i) => 10 * i);
    textTransform = (d) => `${d3.format("~s")(d)}`;
  }

  const checkContrast = (color) => {
    const hsl = d3.hsl(color);
    let L = hsl.l;
    if (L > 0.5) return "#000000";
    return "#ffffff";
  };
  const t = d3.transition().duration(1000).ease(d3.easeLinear);

  div
    .selectAll("div")
    .data(data, (d, i) => i)
    .join(
      (enter) =>
        enter
          .append("div")
          .attr("background", "#999")
          .style("color", "#999")
          .attr("class", "legend-square")
          .call((me) =>
            me
              .transition(t)
              .style("background", (d) => colorScale(d))
              .style("color", (d) => checkContrast(colorScale(d)))
          ),
      (update) =>
        update.call((me) =>
          me
            .transition(t)
            .style("background", (d) => colorScale(d))
            .style("color", (d) => checkContrast(colorScale(d)))
        )
    )
    .text(textTransform)
    .transition(t)
    .delay((d, i) => i * 100);
}

function bivarLegend({ div }) {
  const k = 25;
  const data = d3.cross(d3.range(3), d3.range(3), (i, j) => ({
    x: i * k,
    y: (2 - j) * k,
    fill: bivarColors[j * 3 + i],
  }));
  console.dir(data);
  div
    .selectAll("div")
    .data(data)
    .join("div")
    .style("top", (d) => `-${d.x}px`)
    .style("left", (d) => `${d.y}px`)
    .style("width", `${k}px`)
    .style("height", `${k}px`)
    .style("background", (d) => d.fill)
    .style("position", "absolute")
    .text("");

  div.append("div").text("Associates").attr("class", "assoc");
  div.append("div").text("Cases/100k").attr("class", "cases");
}

export { drawMap, initMap, getAllMapData };
